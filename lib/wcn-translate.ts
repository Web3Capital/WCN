const replacements: Array<[RegExp, string]> = [
  [/项目介绍/g, "Project Overview"],
  [/行业问题/g, "Industry Problems"],
  [/网络架构/g, "Network Architecture"],
  [/WCN如何运作/g, "How WCN Works"],
  [/节点系统/g, "Node System"],
  [/Agent系统/g, "Agent System"],
  [/PoB/g, "PoB"],
  [/商业模式/g, "Business Model"],
  [/节点加入/g, "Node Onboarding"],
  [/治理与合规/g, "Governance & Compliance"],
  [/路线图/g, "Roadmap"],
  [/加入WCN/g, "Join WCN"],
  [/资源中心/g, "Resources"],
  [/白皮书/g, "Whitepaper"],
  [/法律与风险声明/g, "Legal & Risk Disclosure"],
  [/申请成为节点/g, "Apply to Become a Node"],
  [/申请合作/g, "Apply for Partnership"],
  [/获取访问权限/g, "Request Access"],
  [/联系方式/g, "Contact"],
  [/是什么/g, "What it is"],
  [/不是什么/g, "What it is not"],
  [/愿景与使命/g, "Vision & Mission"],
  [/为什么是现在/g, "Why now"],
  [/谁可以加入/g, "Who can join"],
  [/为什么加入/g, "Why join"],
  [/如何加入/g, "How to join"],
  [/席位与授权/g, "Seats & Authorization"],
  [/身份与权限/g, "Identity & Permissions"],
  [/节点获得什么/g, "What nodes get"],
  [/节点需要贡献什么/g, "What nodes contribute"],
  [/最小业务闭环/g, "Minimal business loop"],
  [/从节点到结算的流程/g, "From nodes to settlement"],
  [/人与Agent的角色分工/g, "Human vs Agent roles"],
  [/一个示例流程/g, "An example flow"],
  [/收入来源/g, "Revenue sources"],
  [/节点席位模型/g, "Node seat model"],
  [/服务与成交收入/g, "Service & transaction revenue"],
  [/为什么WCN不依赖发币生存/g, "Why WCN doesn't rely on token issuance"],
  [/结算/g, "Settlement"],
  [/验证/g, "Verification"],
  [/节点/g, "Node"],
  [/第([一二三四五六七八九十]+)章/g, "Chapter $1"]
];

const hasCJK = /[\u3400-\u9FFF]/;

export function toEnglish(input: string) {
  let out = input;
  for (const [re, repl] of replacements) out = out.replace(re, repl);
  return out;
}

export function shouldShowEnglishPlaceholder(text: string) {
  // If a block is still mostly Chinese after replacements, we can optionally hide it.
  // Keep it simple: if it still has CJK, it's not fully translated.
  return hasCJK.test(text);
}

