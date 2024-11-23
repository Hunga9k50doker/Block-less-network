const fs = require("fs").promises;
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const readline = require("readline");
const config = require("./config");
require("colors");

const apiBaseUrl = "https://gateway-run.bls.dev/api/v1";
const ipServiceUrl = "https://tight-block-2413.txlabs.workers.dev";
let useProxy;
const MAX_PING_ERRORS = 3;
const pingInterval = 120000;
const restartDelay = 240000;
const processRestartDelay = 30000;

async function loadFetch() {
  const fetch = await import("node-fetch").then((module) => module.default);
  return fetch;
}

async function promptUseProxy() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Do you want to use a proxy? (y/n): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function fetchIpAddress(fetch, agent) {
  const response = await fetch(ipServiceUrl, { agent });
  const data = await response.json();
  console.log(`[${new Date().toISOString()}] IP fetch response:`, data);
  return data.ip;
}

async function registerNode(nodeId, hardwareId, ipAddress, agent, authToken) {
  const fetch = await loadFetch();
  const registerUrl = `${apiBaseUrl}/nodes/${nodeId}`;
  console.log(`[${new Date().toISOString()}] Registering node with IP: ${ipAddress}, Hardware ID: ${hardwareId}`.blue);
  const response = await fetch(registerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      ipAddress,
      hardwareId,
    }),
    agent,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to parse JSON. Response text:`, text);
    throw new Error(`Invalid JSON response: ${text}`);
  }

  console.log(`[${new Date().toISOString()}] Registration response:`, data);
  return data;
}

async function startSession(nodeId, agent, authToken) {
  const fetch = await loadFetch();
  const startSessionUrl = `${apiBaseUrl}/nodes/${nodeId}/start-session`;
  console.log(`[${new Date().toISOString()}] Starting session for node ${nodeId}, it might take a while...`);
  const response = await fetch(startSessionUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    agent,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to parse JSON. Response text:`, text);
    throw new Error(`Invalid JSON response: ${text}`);
  }

  console.log(`[${new Date().toISOString()}] Start session response:`, data);
  return data;
}

async function pingNode(nodeId, agent, ipAddress, authToken, pingErrorCount) {
  const fetch = await loadFetch();
  const chalk = await import("chalk");
  const pingUrl = `${apiBaseUrl}/nodes/${nodeId}/ping`;

  const proxyInfo = agent ? JSON.stringify(agent.proxy) : "No proxy";

  console.log(`[${new Date().toISOString()}] Pinging node ${nodeId} using proxy ${proxyInfo}`);
  const response = await fetch(pingUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    agent,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text();
    console.error(`[${new Date().toISOString()}] Failed to parse JSON. Response text:`, text);
    pingErrorCount[nodeId] = (pingErrorCount[nodeId] || 0) + 1;
    throw new Error(`Invalid JSON response: ${text}`);
  }

  if (!data.status) {
    console.log(
      `[${new Date().toISOString()}] ${chalk.default.green("First time ping initiate")}, NodeID: ${chalk.default.cyan(nodeId)}, Proxy: ${chalk.default.yellow(proxyInfo)}, IP: ${chalk.default.yellow(
        ipAddress
      )}`
    );
  } else {
    let statusColor = data.status.toLowerCase() === "ok" ? chalk.default.green : chalk.default.red;
    const logMessage = `[${new Date().toISOString()}] Ping response status: ${statusColor(data.status.toUpperCase())}, NodeID: ${chalk.default.cyan(nodeId)}, Proxy: ${chalk.default.yellow(
      proxyInfo
    )}, IP: ${chalk.default.yellow(ipAddress)}`;
    console.log(logMessage);
  }

  pingErrorCount[nodeId] = 0;
  return data;
}

async function displayHeader() {
  const chalk = await import("chalk");
  console.log("");
  console.log(chalk.default.yellow("Tool được phát triển bởi nhóm tele Airdrop Hunter Siêu Tốc (https://t.me/airdrophuntersieutoc)".yellow));
  console.log("");
}

const activeNodes = new Set();
const nodeIntervals = new Map();

async function processNode(node, agent, ipAddress, authToken) {
  const pingErrorCount = {};
  let intervalId = null;

  while (true) {
    try {
      if (activeNodes.has(node.nodeId)) {
        console.log(`[${new Date().toISOString()}] Node ${node.nodeId} is already being processed.`);
        return;
      }

      activeNodes.add(node.nodeId);
      console.log(`[${new Date().toISOString()}] Processing nodeId: ${node.nodeId}, hardwareId: ${node.hardwareId}, IP: ${ipAddress}`);

      const registrationResponse = await registerNode(node.nodeId, node.hardwareId, ipAddress, agent, authToken);
      console.log(`[${new Date().toISOString()}] Node registration completed for nodeId: ${node.nodeId}. Response:`, registrationResponse);

      const startSessionResponse = await startSession(node.nodeId, agent, authToken);
      console.log(`[${new Date().toISOString()}] Session started for nodeId: ${node.nodeId}. Response:`, startSessionResponse);

      console.log(`[${new Date().toISOString()}] Sending initial ping for nodeId: ${node.nodeId}`.blue);
      await pingNode(node.nodeId, agent, ipAddress, authToken, pingErrorCount);

      if (!nodeIntervals.has(node.nodeId)) {
        intervalId = setInterval(async () => {
          try {
            console.log(`[${new Date().toISOString()}] Sending ping for nodeId: ${node.nodeId}`.blue);
            await pingNode(node.nodeId, agent, ipAddress, authToken, pingErrorCount);
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Error during ping: ${error.message}`);

            pingErrorCount[node.nodeId] = (pingErrorCount[node.nodeId] || 0) + 1;
            if (pingErrorCount[node.nodeId] >= MAX_PING_ERRORS) {
              clearInterval(nodeIntervals.get(node.nodeId));
              nodeIntervals.delete(node.nodeId);
              activeNodes.delete(node.nodeId);
              console.error(`[${new Date().toISOString()}] Ping failed ${MAX_PING_ERRORS} times consecutively for nodeId: ${node.nodeId}. Restarting process...`);
              await new Promise((resolve) => setTimeout(resolve, processRestartDelay));
              await processNode(node, agent, ipAddress, authToken);
            }
            throw error;
          }
        }, pingInterval);
        nodeIntervals.set(node.nodeId, intervalId);
      }

      break;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error occurred for nodeId: ${node.nodeId}, restarting process in 50 seconds: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, restartDelay));
    } finally {
      activeNodes.delete(node.nodeId);
    }
  }
}

async function runAll(initialRun = true) {
  try {
    if (initialRun) {
      await displayHeader();
      useProxy = await promptUseProxy();
    }

    for (const user of config) {
      for (const node of user.nodes) {
        let agent = null;
        if (useProxy && node.proxy) {
          if (node.proxy.startsWith("socks")) {
            agent = new SocksProxyAgent(node.proxy);
          } else {
            const proxyUrl = node.proxy.startsWith("http") ? node.proxy : `http://${node.proxy}`;
            agent = new HttpsProxyAgent(proxyUrl);
          }
        }
        const ipAddress = useProxy ? await fetchIpAddress(await loadFetch(), agent) : null;

        processNode(node, agent, ipAddress, user.usertoken);
      }
    }
  } catch (error) {
    const chalk = await import("chalk");
    console.error(chalk.default.yellow(`[${new Date().toISOString()}] An error occurred: ${error.message}`));
  }
}

process.on("uncaughtException", (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception: ${error.message}`);
  runAll(false);
});

runAll();
