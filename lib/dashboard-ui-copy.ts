export type DashboardLang = "en" | "zh";

export const DASHBOARD_UI: Record<
  DashboardLang,
  {
    brand: string;
    groups: Record<
      "overview" | "network" | "work" | "verification" | "intelligence" | "admin" | "ecosystem",
      string
    >;
    items: Record<
      | "myWorkspace"
      | "nodes"
      | "projects"
      | "capital"
      | "dealRoom"
      | "matches"
      | "tasks"
      | "agents"
      | "evidenceDesk"
      | "pobRecords"
      | "disputes"
      | "settlement"
      | "dataCockpit"
      | "riskConsole"
      | "reputation"
      | "approvals"
      | "applications"
      | "users"
      | "invites"
      | "auditLog"
      | "campaigns"
      | "proposals",
      string
    >;
    account: {
      menuAria: string;
      workspace: string;
      profile: string;
      settings: string;
      accountSettings: string;
      siteHome: string;
      signOut: string;
    };
    search: { placeholder: string };
    notifications: {
      aria: string;
      title: string;
      markAllRead: string;
      empty: string;
    };
    shell: {
      navAria: string;
      breadcrumbAria: string;
      openMenu: string;
      closeMenu: string;
      closeMenuBackdrop: string;
      consoleMenu: string;
      breadcrumbRoot: string;
      topTitle: string;
      siteHomeFooter: string;
    };
    roles: Record<string, string>;
    breadcrumbSegment: Record<string, string>;
  }
> = {
  en: {
    brand: "WCN Console",
    groups: {
      overview: "Overview",
      network: "Network",
      work: "Work",
      verification: "Verification",
      intelligence: "Intelligence",
      admin: "Admin",
      ecosystem: "Ecosystem",
    },
    items: {
      myWorkspace: "Workspace",
      nodes: "Nodes",
      projects: "Projects",
      capital: "Capital",
      dealRoom: "Deal Room",
      matches: "Matches",
      tasks: "Tasks",
      agents: "Agents",
      evidenceDesk: "Evidence Desk",
      pobRecords: "PoB Records",
      disputes: "Disputes",
      settlement: "Settlement",
      dataCockpit: "Data Cockpit",
      riskConsole: "Risk Console",
      reputation: "Reputation",
      approvals: "Approvals",
      applications: "Applications",
      users: "Users",
      invites: "Invites",
      auditLog: "Audit Log",
      proposals: "Governance",
      campaigns: "Campaigns",
    },
    account: {
      menuAria: "Account menu",
      workspace: "Workspace",
      profile: "Profile",
      settings: "Settings",
      accountSettings: "Account settings",
      siteHome: "Marketing site",
      signOut: "Sign out",
    },
    search: {
      placeholder: "Search nodes, projects, deals, tasks…",
    },
    notifications: {
      aria: "Notifications",
      title: "Notifications",
      markAllRead: "Mark all read",
      empty: "No notifications yet.",
    },
    shell: {
      navAria: "Console",
      breadcrumbAria: "Breadcrumb",
      openMenu: "Open console menu",
      closeMenu: "Close console menu",
      closeMenuBackdrop: "Close menu",
      consoleMenu: "Menu",
      breadcrumbRoot: "Console",
      topTitle: "WCN Console",
      siteHomeFooter: "Marketing site",
    },
    roles: {
      FOUNDER: "Founder",
      ADMIN: "Admin",
      FINANCE_ADMIN: "Finance",
      NODE_OWNER: "Node owner",
      PROJECT_OWNER: "Project owner",
      CAPITAL_NODE: "Capital",
      SERVICE_NODE: "Service",
      REVIEWER: "Reviewer",
      RISK_DESK: "Risk desk",
      AGENT_OWNER: "Agent owner",
      OBSERVER: "Observer",
      SYSTEM: "System",
      USER: "Member",
    },
    breadcrumbSegment: {
      nodes: "Nodes",
      projects: "Projects",
      capital: "Capital",
      deals: "Deals",
      matches: "Matches",
      tasks: "Tasks",
      agents: "Agents",
      pob: "PoB",
      "proof-desk": "Evidence",
      disputes: "Disputes",
      settlement: "Settlement",
      data: "Data",
      risk: "Risk",
      approvals: "Approvals",
      applications: "Applications",
      users: "Users",
      invites: "Invites",
      audit: "Audit",
      admin: "Admin",
      assets: "Assets",
      notifications: "Notifications",
      onboarding: "Onboarding",
      billing: "Billing",
      review: "Review",
      profile: "Profile",
      settings: "Settings",
      reputation: "Reputation",
      campaigns: "Campaigns",
      governance: "Governance",
    },
  },
  zh: {
    brand: "WCN 控制台",
    groups: {
      overview: "总览",
      network: "网络",
      work: "工作",
      verification: "核验",
      intelligence: "情报",
      admin: "管理",
      ecosystem: "生态",
    },
    items: {
      myWorkspace: "工作台",
      nodes: "节点",
      projects: "项目",
      capital: "资本",
      dealRoom: "交易协作",
      matches: "匹配",
      tasks: "任务",
      agents: "智能体",
      evidenceDesk: "证据台",
      pobRecords: "PoB 记录",
      disputes: "争议",
      settlement: "结算",
      dataCockpit: "数据驾驶舱",
      riskConsole: "风控台",
      reputation: "声誉",
      approvals: "审批",
      applications: "申请",
      users: "用户",
      invites: "邀请",
      auditLog: "审计日志",
      proposals: "治理",
      campaigns: "推广活动",
    },
    account: {
      menuAria: "账户菜单",
      workspace: "工作台",
      profile: "个人资料",
      settings: "设置",
      accountSettings: "账户设置",
      siteHome: "官网首页",
      signOut: "退出登录",
    },
    search: {
      placeholder: "搜索节点、项目、交易、任务…",
    },
    notifications: {
      aria: "通知",
      title: "通知",
      markAllRead: "全部标为已读",
      empty: "暂无通知。",
    },
    shell: {
      navAria: "控制台",
      breadcrumbAria: "面包屑导航",
      openMenu: "打开控制台菜单",
      closeMenu: "关闭控制台菜单",
      closeMenuBackdrop: "关闭菜单",
      consoleMenu: "菜单",
      breadcrumbRoot: "控制台",
      topTitle: "WCN 控制台",
      siteHomeFooter: "官网首页",
    },
    roles: {
      FOUNDER: "创始人",
      ADMIN: "管理员",
      FINANCE_ADMIN: "财务",
      NODE_OWNER: "节点主",
      PROJECT_OWNER: "项目主",
      CAPITAL_NODE: "资本节点",
      SERVICE_NODE: "服务节点",
      REVIEWER: "审核员",
      RISK_DESK: "风控",
      AGENT_OWNER: "智能体主",
      OBSERVER: "观察员",
      SYSTEM: "系统",
      USER: "成员",
    },
    breadcrumbSegment: {
      nodes: "节点",
      projects: "项目",
      capital: "资本",
      deals: "交易",
      matches: "匹配",
      tasks: "任务",
      agents: "智能体",
      pob: "PoB",
      "proof-desk": "证据",
      disputes: "争议",
      settlement: "结算",
      data: "数据",
      risk: "风控",
      approvals: "审批",
      applications: "申请",
      users: "用户",
      invites: "邀请",
      audit: "审计",
      admin: "管理",
      assets: "资产",
      notifications: "通知",
      onboarding: "入驻",
      billing: "账单",
      review: "审核",
      profile: "个人资料",
      settings: "设置",
      reputation: "声誉",
      campaigns: "推广活动",
      governance: "治理",
    },
  },
};

export type DashboardStrings = (typeof DASHBOARD_UI)["en"];
