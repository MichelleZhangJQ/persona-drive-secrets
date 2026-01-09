// lib/professions/driveProfiles.ts
// Bilingual-ready profession profiles + query helpers.

export const DRIVE_NAMES = [
  "Exploration",
  "Achievement",
  "Dominance",
  "Pleasure",
  "Care",
  "Affiliation",
  "Value",
] as const;

export type DriveName = (typeof DRIVE_NAMES)[number];
export type DriveScore = 1 | 2 | 3 | 4 | 5;
export type DriveScores = Record<DriveName, DriveScore>;

export type DriveVector = Record<DriveName, number>;

export type LocalizedText = {
  en: string;
  zh: string;
};

export type OccupationSubtype = {
  name: string;
  name_i18n?: LocalizedText;
  drives: DriveScores;
};

export type OccupationMajor = {
  major: string;
  major_i18n?: LocalizedText;
  subtypes: OccupationSubtype[];
};

export const driveNames = [...DRIVE_NAMES];

export const driveProfiles: OccupationMajor[] = [
  {
    major: "Management",
    major_i18n: { en: "Management", zh: "管理" },
    subtypes: [
      {
        name: "Executive / General Management",
        name_i18n: { en: "Executive / General Management", zh: "高管 / 综合管理" },
        drives: { Exploration: 3, Achievement: 5, Dominance: 5, Pleasure: 2, Care: 2, Affiliation: 4, Value: 3 },
      },
      {
        name: "Project / Product Management",
        name_i18n: { en: "Project / Product Management", zh: "项目 / 产品管理" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 4, Pleasure: 2, Care: 2, Affiliation: 4, Value: 3 },
      },
      {
        name: "People Manager (team lead / middle mgmt)",
        name_i18n: { en: "People Manager (team lead / middle mgmt)", zh: "人员管理（组长 / 中层管理）" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 4, Pleasure: 2, Care: 3, Affiliation: 4, Value: 3 },
      },
    ],
  },

  {
    major: "Business and Financial Operations",
    major_i18n: { en: "Business and Financial Operations", zh: "商业与财务运营" },
    subtypes: [
      {
        name: "Finance (FP&A / accounting / audit)",
        name_i18n: { en: "Finance (FP&A / accounting / audit)", zh: "财务（FP&A / 会计 / 审计）" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 2, Value: 4 },
      },
      {
        name: "Consulting / Strategy / Ops",
        name_i18n: { en: "Consulting / Strategy / Ops", zh: "咨询 / 战略 / 运营" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 3, Pleasure: 2, Care: 2, Affiliation: 4, Value: 3 },
      },
      {
        name: "HR / People Ops",
        name_i18n: { en: "HR / People Ops", zh: "人力资源 / 人才运营" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 3, Pleasure: 1, Care: 4, Affiliation: 5, Value: 4 },
      },
    ],
  },

  {
    major: "Computer and Mathematical",
    major_i18n: { en: "Computer and Mathematical", zh: "计算机与数学" },
    subtypes: [
      {
        name: "Software Engineering (product)",
        name_i18n: { en: "Software Engineering (product)", zh: "软件工程（产品方向）" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 3, Pleasure: 2, Care: 2, Affiliation: 3, Value: 3 },
      },
      {
        name: "ML / Research Engineering",
        name_i18n: { en: "ML / Research Engineering", zh: "机器学习 / 研究工程" },
        drives: { Exploration: 5, Achievement: 5, Dominance: 3, Pleasure: 2, Care: 1, Affiliation: 3, Value: 3 },
      },
      {
        name: "Data / Analytics (BI / stats)",
        name_i18n: { en: "Data / Analytics (BI / stats)", zh: "数据 / 分析（BI / 统计）" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 3, Pleasure: 1, Care: 1, Affiliation: 3, Value: 3 },
      },
    ],
  },

  {
    major: "Architecture and Engineering",
    major_i18n: { en: "Architecture and Engineering", zh: "建筑与工程" },
    subtypes: [
      {
        name: "Engineering (industry)",
        name_i18n: { en: "Engineering (industry)", zh: "工程（工业方向）" },
        drives: { Exploration: 3, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 3, Value: 4 },
      },
      {
        name: "Architecture / Design (buildings)",
        name_i18n: { en: "Architecture / Design (buildings)", zh: "建筑 / 设计（建筑物）" },
        drives: { Exploration: 4, Achievement: 4, Dominance: 3, Pleasure: 2, Care: 2, Affiliation: 3, Value: 4 },
      },
      {
        name: "Safety / Reliability Engineering",
        name_i18n: { en: "Safety / Reliability Engineering", zh: "安全 / 可靠性工程" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 3, Affiliation: 2, Value: 5 },
      },
    ],
  },

  {
    major: "Life, Physical, and Social Science",
    major_i18n: { en: "Life, Physical, and Social Science", zh: "生命 / 自然 / 社会科学" },
    subtypes: [
      {
        name: "Research (IC / staff scientist)",
        name_i18n: { en: "Research (IC / staff scientist)", zh: "研究（独立贡献者 / 科研人员）" },
        drives: { Exploration: 5, Achievement: 5, Dominance: 2, Pleasure: 2, Care: 1, Affiliation: 2, Value: 3 },
      },
      {
        name: "Research (PI / lab lead / principal scientist)",
        name_i18n: { en: "Research (PI / lab lead / principal scientist)", zh: "研究（PI / 课题组负责人 / 首席科学家）" },
        drives: { Exploration: 5, Achievement: 5, Dominance: 3, Pleasure: 2, Care: 2, Affiliation: 3, Value: 3 },
      },
      {
        name: "Applied / Policy Research",
        name_i18n: { en: "Applied / Policy Research", zh: "应用 / 政策研究" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 3, Pleasure: 1, Care: 3, Affiliation: 3, Value: 3 },
      },
    ],
  },

  {
    major: "Community and Social Service",
    major_i18n: { en: "Community and Social Service", zh: "社区与社会服务" },
    subtypes: [
      {
        name: "Social Worker / Counselor (clinical)",
        name_i18n: { en: "Social Worker / Counselor (clinical)", zh: "社工 / 咨询师（临床）" },
        drives: { Exploration: 2, Achievement: 3, Dominance: 2, Pleasure: 1, Care: 5, Affiliation: 5, Value: 5 },
      },
      {
        name: "Case Management / Nonprofit Programs",
        name_i18n: { en: "Case Management / Nonprofit Programs", zh: "个案管理 / 非营利项目运营" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 4, Affiliation: 5, Value: 5 },
      },
    ],
  },

  {
    major: "Legal",
    major_i18n: { en: "Legal", zh: "法律" },
    subtypes: [
      {
        name: "Litigation / Trial",
        name_i18n: { en: "Litigation / Trial", zh: "诉讼 / 出庭" },
        drives: { Exploration: 4, Achievement: 5, Dominance: 5, Pleasure: 1, Care: 2, Affiliation: 3, Value: 4 },
      },
      {
        name: "Corporate / Transactional",
        name_i18n: { en: "Corporate / Transactional", zh: "公司法务 / 交易律师" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 3, Pleasure: 1, Care: 1, Affiliation: 2, Value: 4 },
      },
      {
        name: "Public Interest / Advocacy",
        name_i18n: { en: "Public Interest / Advocacy", zh: "公益法律 / 倡导" },
        drives: { Exploration: 3, Achievement: 4, Dominance: 4, Pleasure: 1, Care: 3, Affiliation: 3, Value: 5 },
      },
    ],
  },

  {
    major: "Education, Training, and Library",
    major_i18n: { en: "Education, Training, and Library", zh: "教育 / 培训 / 图书馆" },
    subtypes: [
      {
        name: "K-12 Teaching",
        name_i18n: { en: "K-12 Teaching", zh: "K-12 教师" },
        drives: { Exploration: 3, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 5, Affiliation: 4, Value: 4 },
      },
      {
        name: "Higher Ed Faculty (research-intensive / PI)",
        name_i18n: { en: "Higher Ed Faculty (research-intensive / PI)", zh: "高校教师（研究型 / PI）" },
        drives: { Exploration: 5, Achievement: 5, Dominance: 3, Pleasure: 1, Care: 3, Affiliation: 3, Value: 4 },
      },
      {
        name: "Higher Ed Teaching Faculty",
        name_i18n: { en: "Higher Ed Teaching Faculty", zh: "高校教师（教学型）" },
        drives: { Exploration: 4, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 4, Affiliation: 4, Value: 4 },
      },
      {
        name: "Library / Information Services",
        name_i18n: { en: "Library / Information Services", zh: "图书馆 / 信息服务" },
        drives: { Exploration: 3, Achievement: 3, Dominance: 1, Pleasure: 1, Care: 3, Affiliation: 3, Value: 4 },
      },
    ],
  },

  {
    major: "Arts, Design, Entertainment, Sports, and Media",
    major_i18n: { en: "Arts, Design, Entertainment, Sports, and Media", zh: "艺术 / 设计 / 文娱 / 体育 / 媒体" },
    subtypes: [
      {
        name: "Creative (artist / writer / designer)",
        name_i18n: { en: "Creative (artist / writer / designer)", zh: "创意工作（艺术家 / 作家 / 设计师）" },
        drives: { Exploration: 5, Achievement: 3, Dominance: 2, Pleasure: 3, Care: 1, Affiliation: 2, Value: 3 },
      },
      {
        name: "Performing / Sports (competitive)",
        name_i18n: { en: "Performing / Sports (competitive)", zh: "表演 / 竞技体育" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 4, Pleasure: 3, Care: 1, Affiliation: 3, Value: 3 },
      },
      {
        name: "Media / Journalism",
        name_i18n: { en: "Media / Journalism", zh: "媒体 / 新闻" },
        drives: { Exploration: 5, Achievement: 4, Dominance: 2, Pleasure: 2, Care: 2, Affiliation: 3, Value: 5 },
      },
    ],
  },

  {
    major: "Healthcare Practitioners and Technical",
    major_i18n: { en: "Healthcare Practitioners and Technical", zh: "医疗专业人员与技术岗位" },
    subtypes: [
      {
        name: "Physician (outpatient / general)",
        name_i18n: { en: "Physician (outpatient / general)", zh: "医生（门诊 / 全科）" },
        drives: { Exploration: 3, Achievement: 4, Dominance: 3, Pleasure: 1, Care: 4, Affiliation: 3, Value: 5 },
      },
      {
        name: "Surgeon / Acute Procedures",
        name_i18n: { en: "Surgeon / Acute Procedures", zh: "外科医生 / 急性手术" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 4, Pleasure: 1, Care: 3, Affiliation: 2, Value: 5 },
      },
      {
        name: "Nurse (RN)",
        name_i18n: { en: "Nurse (RN)", zh: "护士（注册护士 RN）" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 5, Affiliation: 4, Value: 5 },
      },
      {
        name: "Therapist (PT/OT/SLP)",
        name_i18n: { en: "Therapist (PT/OT/SLP)", zh: "治疗师（PT/OT/SLP）" },
        drives: { Exploration: 3, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 5, Affiliation: 4, Value: 5 },
      },
    ],
  },

  {
    major: "Healthcare Support",
    major_i18n: { en: "Healthcare Support", zh: "医疗支持岗位" },
    subtypes: [
      {
        name: "Nursing Assistant / Home Health Aide",
        name_i18n: { en: "Nursing Assistant / Home Health Aide", zh: "护工 / 居家护理助理" },
        drives: { Exploration: 1, Achievement: 3, Dominance: 1, Pleasure: 1, Care: 5, Affiliation: 3, Value: 4 },
      },
      {
        name: "Medical Assistant / Tech Support",
        name_i18n: { en: "Medical Assistant / Tech Support", zh: "医疗助理 / 技术支持" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 4, Affiliation: 2, Value: 4 },
      },
    ],
  },

  {
    major: "Protective Service",
    major_i18n: { en: "Protective Service", zh: "安保与公共安全" },
    subtypes: [
      {
        name: "Police / Law Enforcement",
        name_i18n: { en: "Police / Law Enforcement", zh: "警察 / 执法" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 5, Pleasure: 1, Care: 2, Affiliation: 3, Value: 4 },
      },
      {
        name: "Firefighter / Rescue",
        name_i18n: { en: "Firefighter / Rescue", zh: "消防 / 救援" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 3, Pleasure: 1, Care: 4, Affiliation: 5, Value: 5 },
      },
      {
        name: "Security",
        name_i18n: { en: "Security", zh: "安保" },
        drives: { Exploration: 1, Achievement: 3, Dominance: 3, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
    ],
  },

  {
    major: "Food Preparation and Serving",
    major_i18n: { en: "Food Preparation and Serving", zh: "餐饮制作与服务" },
    subtypes: [
      {
        name: "Back-of-house (cook / chef)",
        name_i18n: { en: "Back-of-house (cook / chef)", zh: "后厨（厨师 / 主厨）" },
        drives: { Exploration: 3, Achievement: 5, Dominance: 3, Pleasure: 2, Care: 2, Affiliation: 3, Value: 2 },
      },
      {
        name: "Front-of-house (server / bartender)",
        name_i18n: { en: "Front-of-house (server / bartender)", zh: "前厅（服务员 / 调酒师）" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 2, Care: 3, Affiliation: 5, Value: 2 },
      },
    ],
  },

  {
    major: "Building and Grounds Cleaning and Maintenance",
    major_i18n: { en: "Building and Grounds Cleaning and Maintenance", zh: "建筑与场地清洁维护" },
    subtypes: [
      {
        name: "Cleaning / Janitorial",
        name_i18n: { en: "Cleaning / Janitorial", zh: "清洁 / 保洁" },
        drives: { Exploration: 1, Achievement: 3, Dominance: 1, Pleasure: 1, Care: 2, Affiliation: 1, Value: 3 },
      },
      {
        name: "Grounds / Landscaping",
        name_i18n: { en: "Grounds / Landscaping", zh: "园林 / 绿化" },
        drives: { Exploration: 2, Achievement: 3, Dominance: 1, Pleasure: 2, Care: 2, Affiliation: 2, Value: 2 },
      },
    ],
  },

  {
    major: "Personal Care and Service",
    major_i18n: { en: "Personal Care and Service", zh: "个人护理与服务" },
    subtypes: [
      {
        name: "Childcare",
        name_i18n: { en: "Childcare", zh: "育儿 / 托育" },
        drives: { Exploration: 2, Achievement: 3, Dominance: 2, Pleasure: 1, Care: 5, Affiliation: 4, Value: 4 },
      },
      {
        name: "Beauty / Wellness",
        name_i18n: { en: "Beauty / Wellness", zh: "美容 / 健康养护" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 3, Care: 3, Affiliation: 5, Value: 2 },
      },
      {
        name: "Hospitality / Concierge",
        name_i18n: { en: "Hospitality / Concierge", zh: "酒店服务 / 礼宾" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 2, Care: 3, Affiliation: 5, Value: 2 },
      },
    ],
  },

  {
    major: "Sales and Related",
    major_i18n: { en: "Sales and Related", zh: "销售相关" },
    subtypes: [
      {
        name: "Retail Sales",
        name_i18n: { en: "Retail Sales", zh: "零售销售" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 2, Care: 2, Affiliation: 5, Value: 2 },
      },
      {
        name: "B2B / Enterprise Sales",
        name_i18n: { en: "B2B / Enterprise Sales", zh: "B2B / 企业销售" },
        drives: { Exploration: 3, Achievement: 5, Dominance: 4, Pleasure: 2, Care: 2, Affiliation: 5, Value: 2 },
      },
      {
        name: "Real Estate / High-commission",
        name_i18n: { en: "Real Estate / High-commission", zh: "房地产 / 高佣金销售" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 4, Pleasure: 2, Care: 2, Affiliation: 4, Value: 2 },
      },
    ],
  },

  {
    major: "Office and Administrative Support",
    major_i18n: { en: "Office and Administrative Support", zh: "办公室与行政支持" },
    subtypes: [
      {
        name: "Admin / Coordinator",
        name_i18n: { en: "Admin / Coordinator", zh: "行政 / 协调员" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 2, Affiliation: 3, Value: 3 },
      },
      {
        name: "Executive Assistant",
        name_i18n: { en: "Executive Assistant", zh: "行政助理（高管助理）" },
        drives: { Exploration: 1, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 3, Value: 4 },
      },
      {
        name: "Customer Support (ops)",
        name_i18n: { en: "Customer Support (ops)", zh: "客户支持（运营）" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 3, Affiliation: 4, Value: 3 },
      },
    ],
  },

  {
    major: "Farming, Fishing, and Forestry",
    major_i18n: { en: "Farming, Fishing, and Forestry", zh: "农业 / 渔业 / 林业" },
    subtypes: [
      {
        name: "Farming / Ranching",
        name_i18n: { en: "Farming / Ranching", zh: "农业 / 牧场经营" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 2, Value: 3 },
      },
      {
        name: "Fishing",
        name_i18n: { en: "Fishing", zh: "渔业" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 1, Affiliation: 2, Value: 2 },
      },
      {
        name: "Forestry / Conservation Field",
        name_i18n: { en: "Forestry / Conservation Field", zh: "林业 / 野外保护工作" },
        drives: { Exploration: 3, Achievement: 3, Dominance: 2, Pleasure: 2, Care: 3, Affiliation: 2, Value: 4 },
      },
    ],
  },

  {
    major: "Construction and Extraction",
    major_i18n: { en: "Construction and Extraction", zh: "建筑施工与采掘" },
    subtypes: [
      {
        name: "Skilled Trades (electrician / plumber)",
        name_i18n: { en: "Skilled Trades (electrician / plumber)", zh: "技术工种（电工 / 管道工）" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 2, Value: 4 },
      },
      {
        name: "General Construction",
        name_i18n: { en: "General Construction", zh: "一般建筑施工" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
      {
        name: "Extraction (mining / oil)",
        name_i18n: { en: "Extraction (mining / oil)", zh: "采掘（矿业 / 石油）" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
    ],
  },

  {
    major: "Installation, Maintenance, and Repair",
    major_i18n: { en: "Installation, Maintenance, and Repair", zh: "安装 / 维护 / 修理" },
    subtypes: [
      {
        name: "Field Service Technician",
        name_i18n: { en: "Field Service Technician", zh: "现场服务技术员" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 2, Value: 4 },
      },
      {
        name: "Mechanic / Repair",
        name_i18n: { en: "Mechanic / Repair", zh: "机械维修 / 修理" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 2, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
    ],
  },

  {
    major: "Production",
    major_i18n: { en: "Production", zh: "生产制造" },
    subtypes: [
      {
        name: "Manufacturing Line",
        name_i18n: { en: "Manufacturing Line", zh: "生产线" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
      {
        name: "Quality Control",
        name_i18n: { en: "Quality Control", zh: "质量控制" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 2, Pleasure: 1, Care: 2, Affiliation: 2, Value: 5 },
      },
      {
        name: "Supervisor (production)",
        name_i18n: { en: "Supervisor (production)", zh: "生产主管" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 4, Pleasure: 1, Care: 2, Affiliation: 3, Value: 4 },
      },
    ],
  },

  {
    major: "Transportation and Material Moving",
    major_i18n: { en: "Transportation and Material Moving", zh: "运输与物料搬运" },
    subtypes: [
      {
        name: "Driver (truck / delivery)",
        name_i18n: { en: "Driver (truck / delivery)", zh: "司机（卡车 / 配送）" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 1, Affiliation: 1, Value: 4 },
      },
      {
        name: "Pilot / Air Transport",
        name_i18n: { en: "Pilot / Air Transport", zh: "飞行员 / 航空运输" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 3, Pleasure: 1, Care: 2, Affiliation: 2, Value: 5 },
      },
      {
        name: "Warehouse / Logistics Handler",
        name_i18n: { en: "Warehouse / Logistics Handler", zh: "仓储 / 物流操作" },
        drives: { Exploration: 1, Achievement: 4, Dominance: 1, Pleasure: 1, Care: 1, Affiliation: 2, Value: 3 },
      },
    ],
  },

  {
    major: "Military Specific",
    major_i18n: { en: "Military Specific", zh: "军队相关" },
    subtypes: [
      {
        name: "Command / Officer Track",
        name_i18n: { en: "Command / Officer Track", zh: "指挥 / 军官路径" },
        drives: { Exploration: 2, Achievement: 5, Dominance: 5, Pleasure: 1, Care: 3, Affiliation: 5, Value: 5 },
      },
      {
        name: "Enlisted / Technical",
        name_i18n: { en: "Enlisted / Technical", zh: "士兵 / 技术岗位" },
        drives: { Exploration: 2, Achievement: 4, Dominance: 3, Pleasure: 1, Care: 2, Affiliation: 4, Value: 5 },
      },
    ],
  },
];

export const OCCUPATION_DRIVE_PROFILES: OccupationMajor[] = driveProfiles;

function norm(s: string) {
  return s.trim().toLowerCase();
}

function pickLocalizedLabel(i18n: LocalizedText | undefined, locale?: string) {
  if (!i18n) return null;
  return locale?.startsWith("zh") ? i18n.zh : i18n.en;
}

export function listMajors(): string[] {
  return OCCUPATION_DRIVE_PROFILES.map((m) => m.major);
}

export function getMajor(major: string): OccupationMajor | null {
  const key = norm(major);
  return OCCUPATION_DRIVE_PROFILES.find((m) => norm(m.major) === key) ?? null;
}

export function getMajorLabel(major: string, locale?: string): string {
  const m = getMajor(major);
  return pickLocalizedLabel(m?.major_i18n, locale) ?? m?.major ?? major;
}

export function listSubtypes(major: string): OccupationSubtype[] {
  return getMajor(major)?.subtypes ?? [];
}

export function getSubtype(major: string, subtypeName: string): OccupationSubtype | null {
  const m = getMajor(major);
  if (!m) return null;
  const key = norm(subtypeName);
  return m.subtypes.find((s) => norm(s.name) === key) ?? null;
}

export function getSubtypeLabel(major: string, subtypeName: string, locale?: string): string {
  const st = getSubtype(major, subtypeName);
  return pickLocalizedLabel(st?.name_i18n, locale) ?? st?.name ?? subtypeName;
}

export function searchSubtypes(query: string): Array<{ major: string; subtype: OccupationSubtype }> {
  const q = norm(query);
  if (!q) return [];
  const out: Array<{ major: string; subtype: OccupationSubtype }> = [];
  for (const m of OCCUPATION_DRIVE_PROFILES) {
    for (const st of m.subtypes) {
      const majorLabel = pickLocalizedLabel(m.major_i18n, "en") ?? "";
      const majorLabelZh = pickLocalizedLabel(m.major_i18n, "zh") ?? "";
      const subtypeLabel = pickLocalizedLabel(st.name_i18n, "en") ?? "";
      const subtypeLabelZh = pickLocalizedLabel(st.name_i18n, "zh") ?? "";

      if (
        norm(st.name).includes(q) ||
        norm(m.major).includes(q) ||
        norm(majorLabel).includes(q) ||
        norm(majorLabelZh).includes(q) ||
        norm(subtypeLabel).includes(q) ||
        norm(subtypeLabelZh).includes(q)
      ) {
        out.push({ major: m.major, subtype: st });
      }
    }
  }
  return out;
}

export function getDefaultSubtypeForMajor(major: string): OccupationSubtype | null {
  const sts = listSubtypes(major);
  if (!sts.length) return null;
  const preferred = sts.find((s) => /general|executive|management|industry|product/i.test(s.name));
  return preferred ?? sts[0];
}

export function averageDriveScores(subtypes: OccupationSubtype[]): DriveScores | null {
  if (!subtypes.length) return null;

  const sums: Record<DriveName, number> = Object.fromEntries(DRIVE_NAMES.map((d) => [d, 0])) as Record<
    DriveName,
    number
  >;

  for (const st of subtypes) {
    for (const d of DRIVE_NAMES) sums[d] += st.drives[d];
  }

  const avg = {} as DriveScores;
  for (const d of DRIVE_NAMES) {
    const v = Math.round(sums[d] / subtypes.length);
    avg[d] = Math.min(5, Math.max(1, v)) as DriveScore;
  }
  return avg;
}
