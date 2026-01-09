import { driveNames } from "@/lib/core-utils/fit-core";

export type DriveName = (typeof driveNames)[number];

export const TRANSFER_ADVICE: Record<DriveName, Partial<Record<DriveName, string>>> = {
  // td = Exploration (surface)
  Exploration: {
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as Exploration & Innovation in your outer personality. This means your curiosity and learning are not just doing whatever you want; they are connected to making progress toward goals. On the surface, it may look like you care more about exploring than executing, but your exploration is ultimately serving your drive to reach goals and gain achievement. When that goal-linked direction is missing, your exploration can become scattered or inefficient without you noticing. The advice is to keep a light output rhythm—combine exploration with one concrete action step, so exploration stays connected to moving your goals forward.",
    Dominance:
      "Some of your inner Decision Leadership energy is redirected and shows up as Exploration & Innovation in your outer personality. This means exploring and learning are, in part, how you build leverage, increase agency, and feel in control. On the surface, it may look like you just like ideas, but the deeper function is to gain influence through getting leading insights. When exploration does not turn into decision power or real impact, you may feel subtly frustrated or limited. The advice is to clearly define your decision scope and boundaries, so your exploration can reliably turn into real agency.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as Exploration & Innovation in your outer personality. This means exploring and learning has become a way for you to relax and enjoy yourself, not just work. On the surface, it may look like you are chasing new knowledge, but your system is using curiosity to compensate for enjoyment and fun. When exploration shifts from nourishing play into restless effort, you can become more drained even while you are doing interesting things. The advice is to protect small, simple pockets of rest or fun, so exploration stays enjoyable instead of turning into a compulsive chase.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as Exploration & Innovation in your outer personality. This means understanding and learning new things is one way you treat people better and protect close relationships more responsibly. On the surface, it may look like you prefer thinking over helping, but that thinking is often preparation for caring well. If you stay in rational analysis too long, you may feel you are only caring in theory, while the relationship still needs action. The advice is to turn insight into one stable caring behavior (check in, follow through, give reassurance), so care is expressed directly.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as Exploration & Innovation in your outer personality. This means learning and new knowledge are a path you use to build connection and a sense of group belonging. On the surface, relationships may seem to depend on whether you can keep producing new viewpoints, but the deeper function is creating social bonding through shared experiences. If freshness becomes a requirement for connection, belonging becomes fragile. The advice is to add some purely belonging-building activities (regular contact, recurring plans, shared commitments), so relationships do not depend on nonstop new ideas.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as Exploration & Innovation in your outer personality. This means exploration and curiosity feel meaningful because they serve your identity, integrity, or inner standards. On the surface, it may look like you are chasing ideas, but your exploration is usually anchored in what is worth pursuing. When you cannot explain its value, you may start doubting whether it is worth it, and your motivation drops. The advice is to clearly name the value of exploration itself (guiding, serving, renewing), so exploration stays an activity with its own enjoyment, instead of becoming self-doubt when you hit setbacks.",
  },

  // td = Achievement (surface)
  Achievement: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means exploration and learning are being guided into execution, and learning becomes a way to produce results. On the surface, you may look very focused on outcomes, but your progress is often driven by interest. If your goals start to feel less novel or too restricted, your motivation may drop because the oxygen of exploration is missing. The advice is to keep a little time each week for exploration, so exploration continues to feed your pursuit of goal achievement instead of being squeezed out by goals.",
    Dominance:
      "Some of your inner Decision Leadership energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means one reason you pursue achievement is to gain autonomy and control. On the surface, it may look like you simply want to perform better, but the deeper goal is often to prove your leadership through competence. If achievements keep piling up but do not bring you more decision power, you may feel subtly trapped or not valued. The advice is to clarify the decision scope you can lead, so your real results can translate into real control.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means one reason you pursue achievement is to help you feel better, more relaxed, or more satisfied. On the surface, you may look like you are always on, but underneath, this is often how you can finally relax. When striving becomes joyless, goal achievement becomes fragile and hard to sustain. The advice is to include entertainment and enjoyment in daily life (reserve some time to relax and enjoy), instead of only relaxing after everything is done.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means one reason you pursue achievement is to give the people close to you stability and/or a sense of safety. On the surface, you may put achievement before family feelings, but your effort is also serving a protective function. If you start carrying everything alone, you will feel responsible while becoming exhausted. The advice is to share responsibility and show direct emotional support—not only protect relationships through achievement results. Let care be expressed through more than just doing tasks.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means one reason you pursue achievement is to maintain belonging, contribution, and group identity. On the surface, it may look like you are chasing goals, but the deeper function is earning acceptance through achievement. If group belonging starts to feel conditional on achievement, you may feel pressure even when you succeed. The advice is to invest some pure energy into relationships (shared time, mutual support, honest openness), so connection does not depend on achievement.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as a pursuit of Goal Achievement in your outer personality. This means you pursue achievement because you feel part of your self-worth depends on it. On the surface, it may look like you are chasing metrics, but your direction is often constrained by your values. If external measures squeeze out meaning, you may still feel an invisible wrongness even when you succeed. The advice is to reflect regularly: Does this fit my values? and adjust goals so achievement stays value-bound.",
  },

  // td = Dominance (surface)
  Dominance: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. On the surface, you may value control more than open exploration, and this strategy partly compensates your curiosity. Deep down, the reason you seek control is to protect your need to explore and innovate. But when the desire to lead decisions becomes too strong, your exploration space shrinks and you may feel strangely restricted. The advice is to use small, low-risk experiments, so exploration can keep going without losing control.",
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. This means taking charge is a strategy to ensure progress, overcome obstacles, and keep moving toward goals. On the surface, control may look like the goal, but the deeper goal is efficiency and results. If decision power does not bring better output, the desire to control may drop. The advice is to shift from only strengthening control toward directly pushing goals forward, without needing to constantly increase control.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. This means control makes you feel more relaxed and safe. Getting control becomes a way to regulate stress. On the surface, you may always be in command mode, but underneath your system is looking for ease. If decision leadership never turns off, enjoyment becomes a right you only get when you stay on top, which is very exhausting. The advice is to schedule clearly non-competitive relaxation time, so enjoyment is available even when you are not controlling outcomes.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. This means your drive for leadership and control has a protective side: you use leadership to make close emotional bonds feel safer and stronger. On the surface, control replaces warmth, but the deeper core is protection. When others need emotional support and reassurance more than guidance, you may feel upset because your care is not landing. The advice is to switch from commanding to caring: ask How can I support you better? and share control where possible, so care becomes mutual and two-way.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. This means you may seek belonging or status in groups by leading or increasing control. On the surface, it looks like you are chasing status, but deeper down you want people to accept you more. But power does not always bring real belonging, so you may still feel lonely even when you are in charge. The advice is to build some horizontal relationships—where you are just a person, not an authority—so belonging does not depend on rank.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as a pursuit of Decision Leadership in your outer personality. This means you partly tie your inner value to your leadership and decision ability, which increases your motivation in this area. On the surface, your desire to lead may seem stronger than personal beliefs, but your decisions still serve your inner values. When those value boundaries are crossed, you may sometimes feel unexplained discomfort or anger. The advice is to clearly understand your value boundaries, so decision making does not cross them.",
  },

  // td = Pleasure (surface)
  Pleasure: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means play and rest are compensating your need to explore. On the surface, it looks like you want to relax and enjoy, but deeper down it may be how you recharge to keep exploring. If surface-level enjoyment starts squeezing out exploration time, you may still feel unsatisfied even while having fun. The advice is to choose quieter relaxing activities, like walks or small hobbies, to restore your exploration energy.",
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means enjoyment is used as a compensation mechanism. On the surface, it looks like comfort-seeking, but it may be compensating your inner drive to achieve. If your progress toward goals stalls, enjoyment can slide from reward into avoidance. The advice is to give relaxation a small space, while pairing it with steady action, so your steps toward goal achievement stay stable.",
    Dominance:
      "Some of your inner Decision Leadership energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means relaxation and fun help you regain groundedness and control. On the surface, it looks like you are relaxing, but your system may be rebuilding agency through rest. If you still feel directionless after relaxing, it is often because decision leadership needs you to express choice. The advice is to pair enjoyment with one decision-leadership action (a decision, a boundary, a plan), so responsibility and enjoyment can move together.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means relaxing and having fun is how you cope with the need for mutual care in close relationships. On the surface, it looks like you prioritize enjoyment, but deeper down you may be protecting your emotional savings. If the relationship needs more than good vibes, you may feel pulled between enjoyment and responsibility. The advice is to keep enjoyment, but also allow yourself to express your need for care; and clearly show caring actions (check in, repair, follow through), so care is mutual and clearly communicated.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means social fun is a bonding mechanism—having fun is how closeness happens. On the surface, it looks like casual hangouts, but the deeper function is belonging. If you start craving deeper relationships, event-based fun can feel shallow. The advice is to reduce the number of people and increase stable contact, so enjoyment keeps building real connection instead of just passing time.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as Entertainment & Enjoyment in your outer personality. This means, in your values, enjoyment and pleasure feel justified. On the surface, it looks like you are playing, but it may also be maintaining your image of a good life. If guilt comes back, it is often because you lose the permission to enjoy life, and enjoyment no longer feels worthwhile. The advice is to frame relaxation and enjoyment as a legitimate basic need and detach it from other reasons; this supports your long-term integrity.",
  },

  // td = Care (surface)
  Care: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as Intimate Protection actions in your outer personality. On the surface, you may spend a lot of energy protecting close relationships, but deeper down you are often learning people’s psychology and what they truly need. If the responsibility of being a protector squeezes out your exploration, you will be more easily drained and less able to offer creative support. The advice is to protect personal exploration time, so you stay mentally nourished while caring for others.",
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as protecting close relationships in your outer personality. This means support and responsibility in close relationships become, to some extent, one of your life goals. On the surface, you may put relationships before personal achievement, but your caring may also satisfy a kind of achievement feeling. If caring fully replaces your pursuit of personal achievement, you may feel quietly stuck while still being busy. The advice is to reserve time for concrete goals, so protecting relationships and personal achievement can both be ways of self-realization.",
    Dominance:
      "Some of your inner decision-control energy is redirected and shows up as Intimate Protection in your outer personality. This means protecting close relationships becomes a way to compensate for your need for control and decisions. On the surface, you may spend more time protecting family or loved ones, but deeper down this can be how you gain control. If caring does not give you any sense of control or decision power, the relationship may start to feel out of control. The advice is to return to emotion-based care: ask what is needed, share responsibility, and let others have choices when possible.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as Intimate Protection in your outer personality. This means helping others feels rewarding and emotionally nourishing, not only duty. On the surface, you may always be available, but your driver can be the good feelings from helping. If you run low, care can become depleted while still feeling necessary. The advice is to schedule direct personal enjoyment so care stays generous instead of draining.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as Intimate Protection in your outer personality. This means caring for close relationships is one way you get belonging, and it also compensates your social needs. On the surface, you may focus on family or a partner and become distant from friends, but then you may ignore your need for friendship. The advice is to keep some space and energy for social needs with friends or colleagues, so caring for family or a partner does not block your friendship needs.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as Intimate Protection in your outer personality. This means responsibility and love become one condition for you to approve of yourself. You believe spending time and energy protecting loved ones is the right thing. On the surface, it looks like self-sacrifice, but deeper down you feel it matches your values. But if caring requires endless giving, you can feel tired under heavy moral pressure. The advice is to redefine intimate protection to include sustainability and boundaries, so care becomes something warm to hope for, not a pattern of self-punishment.",
  },

  // td = Affiliation (surface)
  Affiliation: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as pursuing Interpersonal Relationships in your outer personality. This means community activities are one channel for your curiosity. On the surface, it looks like you need group approval, but deeper down it compensates your need to explore. If your curiosity depends too much on the group, it weakens when others are not engaged. The advice is to keep chances to explore alone, so solo exploration can self-sustain while you still benefit from social connection.",
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as pursuing Interpersonal Relationships in your outer personality. This means good relationships become one channel for your achievement feeling. On the surface, it can look like socializing replaces achievement, but if relationships become a substitute for action, you will feel busy but lack achievement. The advice is to make relationships and achievement actions support each other, so social energy becomes an aid to reaching goals instead of replacing it.",
    Dominance:
      "Some of your inner Decision Leadership energy is redirected and shows up as pursuing Interpersonal Relationships in your outer personality. This means you may seek compensation for control through relationships. On the surface, you may look integrated in the group, but deeper down you may want a sense of control. If you feel powerless in groups, relationships can feel frustrating or performative. The advice is to keep a mutual, reciprocal relationship space; and seek control in areas with clearer rules of authority, so the dominance drive has a suitable outlet.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as pursuing Interpersonal Relationships in your outer personality. This means doing activities with friends or coworkers is an important way you relax and recover. On the surface, you are just social, but deeper down you get relaxation through belonging. If relationships stop feeling easy, relaxation drops and socializing becomes tiring. The advice is to choose smaller, safer circles, so connection brings ease without requiring performance.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as pursuing Interpersonal Relationships in your outer personality. This means interactions with friends or coworkers may be trying to compensate for your needs in close relationships. On the surface, it is just socializing, but inside you may feel it could bring chances to find the close bond you truly want. If you find this does not turn into real closeness, resentment can build quietly. The advice is to state your needs for closeness clearly—say what you need, instead of only hoping social contact will compensate.",
    Value:
      "Some of your inner Moral Value energy is redirected and shows up as Interpersonal Relationships in your outer personality. This means you connect being accepted by the group with your self-worth. On the surface, fitting in makes you feel more confirmed, but deeper down you treat group belonging as proof of your value. When group norms make you uncomfortable, you may deny your self-worth because you fear being rejected, and feel inner tension. The advice is to not use group approval as the standard of your self-worth—let mutual support in relationships nourish you, instead of burning yourself out to gain group recognition.",
  },

  // td = Value (surface)
  Value: {
    Exploration:
      "Some of your inner Exploration & Innovation energy is redirected and shows up as insisting on Moral Values in your outer personality. On the surface, following rules or ideals may override exploration, but deeper down you want ideals to give your exploration a moral anchor. If value constraints become too tight, exploration loses space. The advice is to treat curiosity as basic nutrition—let values support exploration instead of policing it.",
    Achievement:
      "Some of your inner Goal Achievement energy is redirected and shows up as pursuing Moral Values in your outer personality. On the surface, it can look like ideals without action, but achievement is often what powers your values. If you stay in ideals without execution, you feel guilty or stuck. The advice is to translate values into measurable goal commitments, so values are achieved in practice, not only held in your mind.",
    Dominance:
      "Some of your inner Decision Leadership energy is redirected and shows up as pursuing Moral Values in your outer personality. On the surface, pursuing ideals may compensate your desire for leadership. But if you focus on ideals without getting any control, you may feel out of control. The advice is to place moral pursuits and control needs into suitable domains, so both your values and your wish for leadership can be met sustainably.",
    Pleasure:
      "Some of your inner Entertainment & Enjoyment energy is redirected and shows up as pursuing Moral Values in your outer personality. On the surface, values may compensate your desire to relax. But if your value pursuit keeps denying rest as legitimate, you will feel tired. The advice is to reframe rest and enjoyment as necessary and responsible, so enjoyment does not need to be earned through suffering.",
    Care:
      "Some of your inner Intimate Protection energy is redirected and shows up as pursuing Moral Values in your outer personality. On the surface, duty may compensate your need for closeness, but deeper down the desire for closeness cannot be fully replaced. If you focus too much on being correct, you may miss what is actually needed. The advice is to keep the values frame, but keep listening and adjusting with loved ones, so care is practical, not only principled.",
    Affiliation:
      "Some of your inner Interpersonal Relationship energy is redirected and shows up as pursuing Moral Values in your outer personality. On the surface, sticking to ideals may compensate your desire for belonging. But deeper down you want reliable relationship bonds. If your principles start damaging sincere friendship and mutual support, you may feel trapped in overly ideological spaces. The advice is to prioritize groups centered on trust and reciprocity, so values support relationships instead of replacing it.",
  },
};

export const TRANSFER_ADVICE_ZH: Record<DriveName, Partial<Record<DriveName, string>>> = {
  
  Exploration: {
    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为“探索创新”。这意味着你的好奇心与学习并非随意而为，而是与目标进展紧密相连。表面上看，你似乎更重视探索而非执行，但你的探索最终是服务于成就目标的。一旦这种方向感缺失，探索就可能在不知不觉中变得分散或低效。建议：保持轻量输出节奏，将探索与具体行动步骤结合，让创新真正推动目标前进。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为“探索创新”。这说明探索与学习是你建立控制力、提升能动性与掌控感的一种方式。表面上看，你似乎只是喜欢新点子，但更深层的功能是通过获取前沿见解来增强影响力。当探索无法转化为决策权或实际影响时，你可能会感到隐约的挫败或受限。建议：明确你的决策范围与边界，让探索稳定地转化为真实的行动力。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为“探索创新”。这意味着探索对你而言不仅是一种学习，更是一种放松和滋养的方式。表面上看，你似乎在追求新知，实则是在用好奇心满足内在的享乐需求。但当探索从轻松的玩乐变成用力过猛的追逐时，即使做着“有趣的事”，你也可能感到耗竭。建议：保留一些简单纯粹的休息或娱乐片段，让探索保持趣味，而非变成强迫性的任务。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为“探索创新”。这意味着你学习新知、深入理解，是为了更好地照顾他人、以更负责任的方式守护亲密关系。表面上看，你似乎更偏向思考而非行动，但这些思考往往是在为“更好的亲密守护”做准备。然而，若长期停留在理性分析层面，你可能会觉得只是“理论上在守护”，而关系仍需实际行动。建议：将洞见落地为稳定的亲密行为——比如主动问候、持续跟进、给予安心感，让守护被真切地感受到。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为“探索创新”。这意味着你通过学习与分享新知来建立连接、获得归属感。表面上看，你的人际关系似乎依赖于不断提供新观点，但更深层的功能是通过共享体验形成社交联结。如果“新鲜感”成了维系关系的必要条件，归属感就会变得脆弱。建议：加入一些不依赖新观点的纯粹归属活动——如定期联系、固定计划、共同承诺，让人际关系更稳固。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为“探索创新”。这意味着你的探索之所以有意义，是因为它服务于你的身份认同、完整性或内在标准。表面上看，你似乎在追逐点子，但你的探索始终被“什么值得追求”所锚定。一旦说不清其价值，你可能会开始怀疑它是否值得，动力随之减弱。建议：明确探索本身的价值——比如引导他人、服务社会、更新认知——让它成为一种自带乐趣的活动，而非一遇挫折就陷入自我怀疑。`,
  },

  Achievement: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追求。这意味着你的学习与好奇正被导向成果产出，探索成为达成目标的工具。表面上看，你非常注重结果，但你的进展往往由兴趣驱动。如果目标变得单调或受限，探索的“氧气”被抽走，你的动力就可能下降。建议：每周保留一点时间纯粹用于探索，让好奇心持续滋养你的成就追求，而不是被目标完全挤压。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追求。这意味着你追求成就，部分是为了获得自主权与控制感。表面上看，你似乎只想表现得更好，但更深层的目标是通过能力证明自己的领导力。如果成就不断累积却未带来更大的决策权，你可能会感到被困住或不被重视。建议：明确你能主导的范围，让实际成绩转化为真实的掌控感。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追求。这意味着你努力达成目标，部分是为了让自己感觉更好、更放松、更满足。表面上看，你总是“在线”，但底层驱动力其实是：只有完成任务，才能安心享受。当拼搏失去乐趣，成就就会变得脆弱、难以持续。建议：把娱乐享受纳入日常节奏，不必等到“做完再放松”——允许自己边前行边喘息。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追逐。这意味着你追求成就，部分是为了给亲密的人提供安全感与稳定感。表面上看，你似乎把目标放在亲情之前，但你的付出本质上也是一种守护。如果你把所有责任都扛在肩上，就容易在“必须负责”的压力下精疲力尽。建议：学会共同承担，并直接表达情感支持——亲密守护不应只通过“做事”来体现。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追求。这意味着你追求成就，部分是为了维持归属感、贡献感与集体认同。表面上看，你在追逐目标，但更深层的动机是通过成就“赢得”群体的接纳。如果归属感变得以成就为前提，即使成功，你也可能倍感压力。建议：投入一些不依赖成就的纯粹人际互动——如共处时光、互相支持、坦诚交流，让连接回归本真。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为对“目标成就”的追求。这意味着你之所以追求成就，是因为你将自我价值部分绑定于成果之上。表面上看，你在追逐指标，但你的目标选择始终受价值观约束。如果外部评价挤压了内在意义，你可能在成功时仍感到隐隐“不对劲”。建议：定期自问：“这件事符合我的价值观吗？”并据此调整目标，让成就始终与价值同频。`,
  },

  Dominance: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为对“主导决策”的追逐。表面上看，你更看重控制而非开放探索，但这种策略其实也在补偿你的好奇心。你追求掌控的深层目的，是为了保护自己的探索空间。然而，当主导欲过强，探索空间会被压缩，你反而可能感到莫名受限。建议：尝试小规模、低风险的实验，在不失控的前提下继续探索。`,

    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为对“主导决策权”的追求。这意味着你掌控局面，是为了确保目标高效推进、跨越障碍。表面上看，掌握控制权像是目的，但更深层是为了提升执行力与产出结果。如果决策权并未带来更好成果，你的主导欲望就会减弱。建议：从“强化控制”转向“直接推进目标”，不必执着于持续扩大掌控范围。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为对“主导决策权”的追求。这意味着掌控感让你感到放松与安全——取得控制权成了你调节压力的方式。表面上看，你总在掌控模式，但底层可能是系统在寻求轻松感。如果主导欲永远无法关闭，享乐就会变成“只有站在高位才配拥有”的特权，极其消耗心力。建议：明确安排非竞争性的放松时间，让享受不再依赖对结果的控制。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为对“主导决策权”的追求。这意味着你的领导欲带有保护性——你试图通过掌控来让亲密关系更安全、更深厚。表面上看，控制感取代了温度，但内核仍是守护。当对方更需要情感支持而非指导时，你可能会因“守护未落地”而沮丧。建议：从“指挥”切换到“关爱”——多问“我怎样才能更好地支持你？”，并主动分享控制权，让亲密成为双向奔赴。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为对“主导决策权”的追求。这意味着你可能通过领导力或强化控制来获取群体中的归属感或地位。表面上看，你在追求权威，但深层动机是希望被群体接纳。然而，掌权并不等于归属——你可能在“高处”依然感到孤独。建议：建立一些平等的关系，在其中你只是“一个人”，而非“一个角色”，让归属感不依赖等级。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为对“主导决策权”的追求。这意味着你将内在价值部分维系于领导力之上，从而增强了这一维度的动力。表面上看，主导欲似乎压过了信念，但你的决策最终仍服务于核心价值。当这些价值边界被逾越时，你可能会莫名感到不适或愤怒。建议：清晰界定自己的价值底线，确保决策不越界。`,
  },

  Pleasure: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着玩乐与休息是在为探索提供能量补偿。表面上看，你在寻求放松，但更深层可能是为了积蓄力量继续探索。如果享乐过度挤压了探索时间，你可能在“玩得很开心”时仍感到空虚。建议：选择更安静的放松方式，如散步、小爱好等，以恢复探索所需的内在活力。`,

    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着享乐被当作对成就追求的补偿机制。表面上看你在追求舒适，实则可能是在平衡内在的成就压力。如果目标进展停滞，娱乐可能从奖励滑向逃避。建议：为娱乐保留一个小而稳定的空间，同时维持基本行动力，让迈向目标的步伐不至于中断。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着放松能帮你重建掌控感与踏实感。表面上看你在休息，但系统可能正通过放松恢复能动性。如果放松后仍感迷茫，通常是因为你需要“做出选择”来激活主导力。建议：将娱乐与微小的决策结合——比如设定一个边界、制定一个计划，让责任与享受并行。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着“放松”是你应对亲密关系需求的一种自我调节方式。表面上看你优先享乐，但更深层是在维护自己的“情绪储蓄”。当关系需要的不只是“好氛围”时，你可能在享乐与责任间感到拉扯。建议：保留享受空间，同时允许自己表达对亲密的需求；并通过明确行为（如问候、修复、跟进）让守护被清晰传达。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着社交中的快乐是一种联结机制——“好玩”是亲近发生的方式。表面上看是随意聚会，但深层功能是建立归属。如果你渴望更深的关系，事件型的快乐就会显得浅薄。建议：减少社交人数，增加稳定联系，让娱乐成为真实连接的积累，而非时间消遣。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为“娱乐享受”。这意味着在你的价值观中，享受生活是正当且必要的。表面上看你在玩，但这可能也是在维护“美好生活”的自我形象。当内疚感浮现，往往是因为你失去了“享受的许可”——享乐不再被视为值得。建议：明确将放松与娱乐定义为基本需求，与其他理由解绑，从而保护你的长期心理完整性。`,
  },

  Care: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为“亲密守护”。表面上看，你花大量精力照顾他人，但更深层的驱动力是理解对方心理、探索他们的真实需求。如果守护责任过度挤压了你的探索空间，你会更容易耗竭，也难给出有创造力的支持。建议：保护个人探索时间，让你在守护他人时仍能保持心智活力。`,

    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为对亲密关系的守护。这意味着亲密关系中的支持与责任，某种程度上成了你的人生目标之一。表面上看，你把关系置于个人成就之上，但你的守护行为也可能在满足某种成就感。如果亲密完全取代了个人成长，你可能在“很忙”的同时感到悄然停滞。建议：为个人目标保留专属时间，让亲密守护与自我实现并行不悖。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为“亲密守护”。这意味着你通过守护亲密关系来补偿对控制感的需求。表面上你专注于家庭或亲人，但深层是在借此获得掌控感。如果守护无法带来决策权，关系可能反而失控。建议：回归基于情感的守护——多问对方需要什么，分担责任，并尽可能赋予对方选择权。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为“亲密守护”。这意味着给予支持本身就能带给你情绪滋养，而不只是义务。表面上看你总是“在线”，但底层驱动力可能是助人带来的正向感受。一旦资源枯竭，守护会变成消耗，却仍感觉“必须继续”。建议：安排专属的个人娱乐时间，让守护保持慷慨，而非沦为自我牺牲。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为“亲密守护”。这意味着你通过守护亲密关系来满足归属需求，甚至以此替代更广泛的社交。表面上你因家庭或伴侣而疏远朋友，但你可能忽略了自身的交友需要。建议：保留精力与空间给朋友或同事，让亲密守护不阻碍你多元的人际联结。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为“亲密守护”。这意味着责任与爱成为你认可自我的条件之一——你认为花时间守护亲人是“正确”的事。表面上看像自我牺牲，但深层驱动力是价值观的践行。然而，若守护要求你无止境付出，你会在道德重压下疲惫不堪。建议：重新定义“亲密守护”——纳入可持续性与边界，让它成为温馨的向往，而非惩罚自己的方式。`,
  },

  Affiliation: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着参与社群是你满足好奇心的一种渠道。表面上看，你需要群体认可，但更深层是在借社交补偿探索欲。但如果探索过度依赖外部群体，一旦他人不投入，你的兴趣也会迅速冷却。建议：保留独自探索的机会，让内在好奇能自我供给，同时仍从人际连接中获益。`,

    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着良好的人际关系成了你获得成就感的替代路径。表面上看，你用社交取代了目标追求，但如果关系变成成就的替身，你会感觉忙碌却缺乏实质进展。建议：让人际互动与目标行动相辅相成，使社交成为助力，而非替代。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着你可能在群体中寻找对控制感的补偿。表面上你“融入”了集体，但深层可能是为了获得掌控感。如果在群体中感到无力，社交就会变得令人沮丧，甚至像一场表演。建议：保留一个以互惠为基础的人际空间，同时在规则清晰的领域追求掌控，让主导欲有合适出口。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着与朋友同事共处是你恢复精力的重要方式。表面上看你只是在社交，但深层驱动力是通过归属获得放松。如果人际关系变得不轻松，社交就会变成负担。建议：选择更小、更安全的圈子，让人际连接带来自在，而非表演压力。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着你通过朋友或同事的互动，来弥补对深度亲密关系的渴望。表面上你只是在社交，但内心可能期待这些交往能导向真正的亲密。如果这种期待落空，怨气可能悄然累积。建议：清晰表达你对亲密关系的真实需求，而非一味希望通过泛泛之交获得补偿。`,

    Value: `你的一部分内在“道德价值”驱动力能量被分流，并在外在人格中表现为对“人际关系”的追求。这意味着你将被群体接纳与自我价值挂钩。表面上看，融入社群让你更认同自己，但深层是因为你视“被接受”为价值的证明。然而，当某些群体规范让你不适，你可能因害怕被排斥而否定自我，陷入内在冲突。建议：不以群体认同作为自我价值的标尺，让人际关系中的互惠与支持滋养你，而非消耗你。`,
  },

  Value: {
    Exploration: `你的一部分内在“探索创新”驱动力能量被分流，并在外在人格中表现为对“道德价值”的坚持。表面上看，你对理想或规则的遵从似乎压制了探索，但更深层的心理是：你想为探索赋予道德锚点。然而，如果价值规范过于严苛，探索就会失去空间。建议：将探索视为基本营养，让价值支持好奇，而非监管它。`,

    Achievement: `你的一部分内在“目标成就”驱动力能量被分流，并在外在人格中表现为对“道德价值”的追求。表面上看，你似乎只有理想没有行动，但目标成就其实是你坚持价值的引擎。如果只停留于理想而缺乏实践，你会感到内疚或停滞。建议：将价值转化为可衡量的承诺与行动，在实践中成就价值，而非仅在理念中坚守。`,

    Dominance: `你的一部分内在“主导决策”驱动力能量被分流，并在外在人格中表现为对“道德价值”的追求。表面上看，追求理想似乎满足了你对主导权的渴望，但如果你在道德实践中始终缺乏掌控感，就会感到失控。建议：将对价值的坚持与对掌控的需求分别安放于合适的领域，让两者都能被持续满足。`,

    Pleasure: `你的一部分内在“娱乐享受”驱动力能量被分流，并在外在人格中表现为对“道德价值”的追求。表面上看，你对价值的坚持似乎压制了享乐欲望，但若你长期否认放松的正当性，就会陷入疲惫。建议：重新定义休息与娱乐——它们不是奖赏，而是负责任的自我照料，无需通过“受苦”来赚取。`,

    Care: `你的一部分内在“亲密守护”驱动力能量被分流，并在外在人格中表现为对“道德价值”的追求。表面上看，责任与义务似乎替代了亲密需求，但关系的渴望无法被原则完全取代。如果你过度关注“正确”，反而可能错过对方的真实需要。建议：在坚守价值框架的同时，保持对伴侣或家人的倾听、回应与灵活调整，让守护成为实际的行动，而非僵化的教条。`,

    Affiliation: `你的一部分内在“人际关系”驱动力能量被分流，并在外在人格中表现为对“道德价值”的追求。表面上看，对理想的坚持似乎补偿了归属需求，但更深层的渴望是可靠的人际纽带。然而，若对原则的执着损害了真诚的友谊，你可能会被困在过度意识形态化的空间里。建议：优先选择以信任与互惠为核心的群体，让价值支持人际关系，而非取代它。`,
  },
};



export function getTransferAdvice(surfaceDrive: DriveName, innateDrive: DriveName) {
  return TRANSFER_ADVICE[surfaceDrive]?.[innateDrive];
}

export function getTransferAdviceLocale(surfaceDrive: DriveName, innateDrive: DriveName, locale?: string) {
  const isZh = locale?.startsWith("zh");
  if (isZh) {
    return TRANSFER_ADVICE_ZH[surfaceDrive]?.[innateDrive] ?? TRANSFER_ADVICE[surfaceDrive]?.[innateDrive];
  }
  return TRANSFER_ADVICE[surfaceDrive]?.[innateDrive];
}
