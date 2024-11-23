//maximum 5 node id for each account, not deleted. Not change. So U should save data
module.exports = [
  {
    usertoken: "usertoken1",
    nodes: [
      { nodeId: "nodeid2(pubKey)", hardwareId: "hardwareid2", proxy: "proxy2" },
      { nodeId: "nodeid3(pubKey)", hardwareId: "hardwareid3", proxy: "proxy3" },
      { nodeId: "nodeid4(pubKey)", hardwareId: "hardwareid4", proxy: "proxy4" },
      { nodeId: "nodeid5(pubKey)", hardwareId: "hardwareid5", proxy: "proxy5" },
    ],
  },
  {
    usertoken: "usertoken2",
    // if not use proxy, set proxy = ""
    nodes: [
      { nodeId: "nodeid6(pubKey)", hardwareId: "hardwareid6", proxy: "" },
      { nodeId: "nodeid7(pubKey)", hardwareId: "hardwareid7", proxy: "" },
      { nodeId: "nodeid8(pubKey)", hardwareId: "hardwareid8", proxy: "" },
      { nodeId: "nodeid9(pubKey)", hardwareId: "hardwareid9", proxy: "" },
      { nodeId: "nodeid10(pubKey)", hardwareId: "hardwareid10", proxy: "" },
    ],
  },
  // Add more usertokens as needed
];
