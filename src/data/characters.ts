export interface Skill {
  name: string;
  description: string;
  damage: number;
  mpCost: number;
  cooldown: number;
  type: 'melee' | 'ranged' | 'buff' | 'heal' | 'debuff';
  effect?: 'knockback' | 'stun' | 'shield' | 'crit';
}

export interface Character {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  maxMp: number;
  attackPower: number;
  attackSpeed: number;
  moveSpeed: number;
  color: string;
  accentColor: string;
  skills: {
    attack: Skill;
    skill1: Skill;
    skill2: Skill;
    ultimate: Skill;
  };
  sprite: string;
  taunts: string[];
}

export const characters: Character[] = [
  {
    id: 'xiaoming',
    name: '小明',
    title: '程序员',
    maxHp: 100,
    maxMp: 100,
    attackPower: 8,
    attackSpeed: 6,
    moveSpeed: 4,
    color: '#00ff88',
    accentColor: '#0088ff',
    sprite: '👨‍💻',
    taunts: [
      '你写的代码全是屎山！', '重构三次还是这德性！', '变量名能不能好好起！',
      '注释比代码还多！', '又引入新 bug 了？', '这性能也敢上线？',
      'Ctrl+C Ctrl+V 工程师！', '你的代码只有机器能看懂！',
      '天天改需求你受得了？', '提测就崩，真稳！', '生产环境又炸了！',
      '你在写啥天书呢？', '这系统跑得比我奶奶还慢！', '你的代码需要考古学家！',
      '三天写两行，效率真高！', '全栈？全站 BUG 吧！', '面向百度编程！',
    ],
    skills: {
      attack: {
        name: '键盘敲击',
        description: '快速连打',
        damage: 5,
        mpCost: 0,
        cooldown: 0,
        type: 'melee',
      },
      skill1: {
        name: '代码注入',
        description: '发射键盘弹幕',
        damage: 12,
        mpCost: 20,
        cooldown: 30,
        type: 'ranged',
      },
      skill2: {
        name: '死机冲击',
        description: '冲刺撞击',
        damage: 18,
        mpCost: 35,
        cooldown: 60,
        type: 'melee',
        effect: 'knockback',
      },
      ultimate: {
        name: '系统崩溃',
        description: '全屏代码雨攻击',
        damage: 35,
        mpCost: 100,
        cooldown: 180,
        type: 'ranged',
        effect: 'stun',
      },
    },
  },
  {
    id: 'emily',
    name: 'Emily',
    title: 'HR',
    maxHp: 90,
    maxMp: 110,
    attackPower: 7,
    attackSpeed: 5,
    moveSpeed: 5,
    color: '#ff69b4',
    accentColor: '#ff1493',
    sprite: '👩‍💼',
    taunts: [
      '你的谈话一点用没有！', '就知道给人穿小鞋！', '绩效打那么低良心呢？',
      '招聘标准是你家定的？', '就会整些团建活动！', '面试就知道问星座！',
      '培训内容能不能换换！', '你的 PPT 比我命还长！', '就知道约谈！约谈！',
      '公司文化就这？', '迟到一分钟你记半年！', '年会节目越来越烂！',
      '员工关怀就是发邮件？', '你比老板还像老板！', '辞退理由能再假点吗？',
      '入职培训跟传销似的！', '团建去爬山？谁爱去谁去！',
    ],
    skills: {
      attack: {
        name: '文件夹拍打',
        description: '拍打攻击',
        damage: 6,
        mpCost: 0,
        cooldown: 0,
        type: 'melee',
      },
      skill1: {
        name: '绩效谈话',
        description: '远程声波攻击',
        damage: 10,
        mpCost: 15,
        cooldown: 25,
        type: 'ranged',
      },
      skill2: {
        name: '团队优化',
        description: '生成护盾',
        damage: 0,
        mpCost: 30,
        cooldown: 90,
        type: 'buff',
        effect: 'shield',
      },
      ultimate: {
        name: '裁员风暴',
        description: '文件如雨点般落下',
        damage: 30,
        mpCost: 100,
        cooldown: 180,
        type: 'ranged',
      },
    },
  },
  {
    id: 'zhangzong',
    name: '张总',
    title: '老板',
    maxHp: 130,
    maxMp: 80,
    attackPower: 12,
    attackSpeed: 3,
    moveSpeed: 2,
    color: '#ffd700',
    accentColor: '#ff8c00',
    sprite: '🧔',
    taunts: [
      '就会画大饼！', '加薪？不存在的！', '你的承诺像放屁！',
      '又画饼又 PUA！', '除了拍桌还会啥！', '公司没你照样转！',
      '你的战略就没对过！', '钱给不到位还谈理想！', '整天开会开个没完！',
      '邮件群发全公司！', '厕所装监控算了！', '你那破车够买我十年工资！',
      '决策比乌龟还慢！', '就知道说"我再想想"！', '发言比裹脚布还长！',
      '就这管理水平？', '等你退休等到花都谢了！',
    ],
    skills: {
      attack: {
        name: '威严拍桌',
        description: '震慑攻击',
        damage: 8,
        mpCost: 0,
        cooldown: 0,
        type: 'melee',
      },
      skill1: {
        name: '会议室召唤',
        description: '瞬移到敌人身后',
        damage: 15,
        mpCost: 25,
        cooldown: 50,
        type: 'melee',
        effect: 'knockback',
      },
      skill2: {
        name: '加薪诱惑',
        description: '减少敌人攻击力',
        damage: 5,
        mpCost: 20,
        cooldown: 60,
        type: 'debuff',
      },
      ultimate: {
        name: '明天不用来了',
        description: '一巴掌拍飞',
        damage: 40,
        mpCost: 100,
        cooldown: 200,
        type: 'melee',
        effect: 'knockback',
      },
    },
  },
  {
    id: 'xiaohong',
    name: '小红',
    title: '财务',
    maxHp: 95,
    maxMp: 100,
    attackPower: 9,
    attackSpeed: 5,
    moveSpeed: 4,
    color: '#4169e1',
    accentColor: '#1e90ff',
    sprite: '👩‍💻',
    taunts: [
      '报销拖了三个月了！', '一分钱也要审批！', '你的计算器算不明白！',
      '发票比命还重要！', '预算砍得真狠啊！', '抠门到家了！',
      '你的 Excel 比城墙还厚！', '五块钱也要贴发票？', '工资算错几次了！',
      '财务自由？你先管好账吧！', '对账永远对不平！', '报销流程走半年！',
      '你比老板还会省钱！', '发票贴得跟艺术品似的！', '催报销你倒是不急！',
      '账本比你的人生还精彩！', '就知道卡预算！',
    ],
    skills: {
      attack: {
        name: '计算器戳击',
        description: '精准戳击',
        damage: 6,
        mpCost: 0,
        cooldown: 0,
        type: 'melee',
      },
      skill1: {
        name: '精确预算',
        description: '高暴击率一击',
        damage: 20,
        mpCost: 25,
        cooldown: 40,
        type: 'melee',
        effect: 'crit',
      },
      skill2: {
        name: '报销单据',
        description: '投掷文件持续伤害',
        damage: 8,
        mpCost: 20,
        cooldown: 35,
        type: 'ranged',
      },
      ultimate: {
        name: '财务审计',
        description: '计算器全屏闪光',
        damage: 32,
        mpCost: 100,
        cooldown: 180,
        type: 'ranged',
        effect: 'stun',
      },
    },
  },
  {
    id: 'ajie',
    name: '阿杰',
    title: '销售',
    maxHp: 100,
    maxMp: 100,
    attackPower: 8,
    attackSpeed: 7,
    moveSpeed: 6,
    color: '#ff4500',
    accentColor: '#ff6347',
    sprite: '🧑‍💼',
    taunts: [
      '又在吹牛了！', '签单全是忽悠来的！', '你的承诺兑现过吗！',
      '客户投诉都堆成山了！', '方案编得挺像回事！', '就这业绩还敢吹！',
      '你的 PPT 比产品还好！', '客户都被你得罪完了！', '一个月没开单了吧！',
      '指标永远完不成！', '你的嘴比产品还能吹！', '回款催了八百遍了！',
      '这也能叫大客户？', '喝酒比干活积极！', '合同条款都看不明白！',
      '拜访记录全是编的！', '你的朋友圈全是广告！',
    ],
    skills: {
      attack: {
        name: '名片飞射',
        description: '快速名片攻击',
        damage: 5,
        mpCost: 0,
        cooldown: 0,
        type: 'ranged',
      },
      skill1: {
        name: '热情推销',
        description: '连续踢腿',
        damage: 15,
        mpCost: 25,
        cooldown: 40,
        type: 'melee',
      },
      skill2: {
        name: '客户关系',
        description: '短暂无敌',
        damage: 0,
        mpCost: 35,
        cooldown: 80,
        type: 'buff',
        effect: 'shield',
      },
      ultimate: {
        name: '签单时刻',
        description: '合同龙卷风',
        damage: 35,
        mpCost: 100,
        cooldown: 180,
        type: 'ranged',
      },
    },
  },
  {
    id: 'meimei',
    name: '美美',
    title: '行政',
    maxHp: 110,
    maxMp: 90,
    attackPower: 7,
    attackSpeed: 4,
    moveSpeed: 4,
    color: '#9370db',
    accentColor: '#ba55d3',
    sprite: '👩‍🔧',
    taunts: [
      '文具都被你藏哪了！', '会议室永远订不到！', '空调温度你管得真宽！',
      '下午茶就这水平？', '你的通知比老板还多！', '打印机坏了三百年了！',
      '办公桌能不能换换！', '饮水机又没水了！', '团建除了吃饭还会啥！',
      'WiFi 密码改八百遍了！', '考勤制度比法律还严！', '工位比鸽子笼还小！',
      '绿化全是假花！', '保洁阿姨都比你勤快！', '快递永远找不到！',
      '办公用品申请要审批？', '前台比老板架子还大！',
    ],
    skills: {
      attack: {
        name: '文具盒拍击',
        description: '文具盒拍打',
        damage: 6,
        mpCost: 0,
        cooldown: 0,
        type: 'melee',
      },
      skill1: {
        name: '会议室预定',
        description: '创建障碍物',
        damage: 10,
        mpCost: 20,
        cooldown: 50,
        type: 'buff',
      },
      skill2: {
        name: '下午茶时间',
        description: '回复生命值',
        damage: 0,
        mpCost: 25,
        cooldown: 70,
        type: 'heal',
      },
      ultimate: {
        name: '组织团建',
        description: '野餐垫全屏AOE',
        damage: 28,
        mpCost: 100,
        cooldown: 180,
        type: 'ranged',
      },
    },
  },
];
