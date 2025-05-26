(function() { // IIFE Start
    'use strict';

    // --- Configuration & Constants ---
    const NOVEL_READER_CONFIG = {
        STORAGE_KEYS: {
            THEME: 'NOVEL_READER_THEME_V1',
            FONT_SIZE_INDEX: 'NOVEL_READER_FONT_SIZE_INDEX_V2',
            FONT_FAMILY: 'NOVEL_READER_FONT_FAMILY_V1',
            BOOKMARKS: 'NOVEL_READER_BOOKMARKS_V3'
        },
        AVG_CHARS_PER_MINUTE: 220,
        FONT_SIZES: [
            { name: '小', size: 18 },
            { name: '中', size: 20 },
            { name: '大', size: 24 },
            { name: '特大', size: 28 }
        ],
        DEFAULT_FONT_SIZE_INDEX: 1, // '中' (20px)
        FONT_FAMILIES: [
            { name: '仓耳今楷', value: '"TsangerJinKaiW02", "仓耳今楷01-27533-W02", "仓耳今楷", serif' },
            { name: '默认黑体 (思源)', value: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
            { name: '阅读宋体 (思源)', value: '"Noto Serif SC", "SimSun", "FangSong", serif' },
            { name: '系统楷体', value: '"KaiTi", "STKaiti", cursive, sans-serif' },
            { name: '平台默认无衬线', value: 'sans-serif' },
            { name: '平台默认衬线', value: 'serif' }
        ],
        THEMES: ['system', 'light', 'dark'],
        DEFAULT_THEME_INDEX: 0, // 'system'
        SCROLL_SHOW_TOP_BTN_THRESHOLD: 300, // Pixels
        FEEDBACK_MESSAGE_DURATION: 1500 // Milliseconds (Keep for bookmarks)
    };

    const novelData = {
            title: "《知微见著》",
            author: "AI·Orange",
            chapters: [
                {
                    id: "chapter-0",
                    title: "序章：崩溃的清晨",
                    content: `
                        <p>当时针指向清晨五点半，窗外，天色已不再晦暗，一抹橙红正从地平线处冉冉升起，将首都T3航站楼巨大的玻璃幕墙映照得熠熠生辉。停机坪上，繁忙而有序的景象正在拉开序幕：一架架银色巨鸟，在引导车的精准牵引下，或缓缓驶向跑道，或安静地停泊在各自的机位，它们的巨大身躯蕴含着即将腾飞的强大能量。远机位登机口，廊桥内的空调送出暖风，驱散了户外残余的清冷，为即将开始的繁忙注入暖意。</p>
                        <p>知微整理了一下身上合体的暗红色制服，目光投向一架刚完成上客的航班。发动机的轰鸣声由远及近，如同即将奏响的序曲，沉稳而富有力量。那庞然大物在跑道上加速，随即昂首冲入一片湛蓝的清晨天空，尾灯划出一道弧线，便隐入云端，朝着远方破浪而去。</p>
                        <p>这是她入职地面服务部的第二十天。二十天，对于熟悉一份工作而言，不过是个开始；但对知微来说，却像是经历了整整两百场无声的战役，每一场都让她精疲力尽，溃不成军。</p>
                        <p>清晨的航站楼本该是高效而有序的，但今天，混乱像一剂催化剂，在她负责的登机口迅速发酵。一位计划经T市中转前往东南亚某国的旅客，因签证信息与边检系统记录存在细微出入，被暂时拦下。焦灼的汗珠从旅客额角渗出，他不懂中文，英文也磕磕绊绊，登机口用作应急的翼语通-多语种广播系统偏偏在这时掉了链子，播报出的安抚和解释含混不清，反而加剧了他的不安。</p>
                        <p>雪上加霜的是，地面离港系统突然卡顿，屏幕上显示的登机旅客列表与实际登机的人数迟迟无法对应。绿色的"已登机"数字固执地停在一个令人尴尬的数值上，远低于实际人数。机组已经开始通过无线电催促："地服地服，旅客登机情况？能否准时关门？"那声音带着职业性的冷静，却像一把小锤，不轻不重地敲在知微紧绷的神经上。</p>
                        <p>而本该最后登机的几位旅客，被这突如其来的签证风波和系统故障搅得情绪激动，其中一位中年男士涨红了脸，挥舞着登机牌，高声质问："你们航空公司怎么回事？这点小事都处理不明白？我们要延误了！"</p>
                        <p>知微感到一阵强烈的眩晕。她不是没准备，那些厚厚的《地服突发事件应急处理流程手册》条款，她昨夜还在枕边翻阅，每一条都清晰地印在脑海中，却在这一刻化作一堆杂乱的符号，根本无法在脑海中迅速串联起应对眼前乱局的完整链条。 她试图在工作群里搜寻，可海量的聊天记录和通知截图，根本无从下手。她下意识地拨打师傅李姐的电话，听筒里只有冰冷的忙音，像是在嘲笑她的孤立无援。</p>
                        <p>"你们不是专业的吗？连这点小事都处理不明白？"中年男士的质问携着热浪扑面而来，像一把锋利的刀，直刺知微心中最脆弱的角落。她努力想开口解释、安抚，可喉咙像被堵住一般，连一句完整的话都组织不起来。乘客的焦躁、机组的催促、同事们各自忙碌的身影，以及那本似乎永远翻不到正确页码的手册，共同织成一张密不透风的网，将她牢牢困住。羞愧和一种深不见底的无力感，让她几乎无法呼吸。她明明"拥有"着这些知识，却发现它们在最需要的时候，竟如此遥远和无力，比一无所知更加绝望。</p>
                        <p>她下意识地低下头，盯着自己那双在地面上徒劳地挪动了几次的新制服皮鞋，脑海中一片混乱，最终只剩下令人窒息的空白。</p>
                        <p>人群中，另一个声音幽幽传来，带着一丝不易察觉的讥讽："呵，现在的年轻人啊……"</p>
                        <p>知微的指甲深深掐进了掌心。她心中有个声音在微弱地辩解："我是地服人员，但我并非无所不知的智库。我只是……被这堆积如山的信息，困在了原地。"</p>
                        <p>这崩溃的清晨，像一盆冰水，将她对这份工作最初的热情和憧憬，浇了个透心凉。她第一次如此深刻地体会到，当知识无法被高效组织、检索和精准调用时，它就等同于不存在。 而她，就像一个守着宝山却找不到钥匙的穷人。</p>
                    `
                },
                {
                    id: "chapter-1",
                    title: "第一章：知识的幻觉与一缕微光",
                    content: `
                        <p>混乱最终在一位经验丰富的值班主管赶到后，凭借其强硬的姿态和熟练的业务技巧，暂时得以平息。那名签证有疑的旅客被带离进行进一步核实，离港系统也在IT部门的远程操作下恢复了正常。延误了十五分钟后，航班总算得以起飞。</p>
                        <p>知微站在空荡荡的登机口，残留的紧张感依旧让她手脚冰凉。清晨的阳光透过巨大的玻璃窗投射进来，在地板上切割出冰冷的几何图形，却丝毫无法温暖她内心的寒意。刚才那位中年男寄予厚望又失望透顶的眼神，像一根细密的针，反复刺穿着她的自尊。</p>
                        <p>她是一个习惯于思考的年轻人，甚至有些过于敏感。大学时，她偏爱哲学，尤其记得一位白发苍苍的老教授在课堂上说过的一段话："我们往往认为，拥有知识意味着知晓一切既定的答案。但实则不然，真正的知识，在于能够持续地、深入地提出问题，在于面对未知时那份探索的勇气与智慧。答案是知识的果实，而提问，才是知识生长的根系。" </p>
                        <p>那时，她对这番话似懂非懂，只觉得充满了形而上的智慧。然而，此刻，当她将这番话投入到地服岗位的现实熔炉中，却感受到了冰与火的剧烈碰撞。真正的知识在于提问，可当知识被封存在海量手册中，当压力让我们的大脑宕机，我们又该如何向它提出问题？这个岗位上，'不知道'几乎等同于不可饶恕的原罪，而试图'翻书'或'询问'，又显得如此不专业和低效。</p>
                        <p>标准流程、应急预案、各项规章……公司将海量的"标准答案"详尽地印刷在各类手册中，层层叠叠，堆积如山。然而，这些"答案"更像是被尘封在档案馆深处的古籍，静默而孤高。组织花费了大量精力去编撰和更新这些"法典"，却似乎从未真正关注过，一线人员在面对瞬息万变的现场时，该如何高效地、精准地调用这些知识。</p>
                        <p>记忆，成为了无形中最为倚重的工具。可人的记忆何其有限，又何其容易在压力下失灵？</p>
                        <p>知微开始对整个看似严谨的知识传递与应用体系，从心底产生了一丝细微的、却执拗的质疑。</p>
                        <p>为何在信息爆炸的时代，我们在应对如此繁杂的流程时，依然要将大脑当作低效的硬盘，去进行"死记硬背"式的存储？</p>
                        <p>为何那些本该为我们排忧解难的知识，却如同束之高阁的古董，无法成为一位近在咫尺、随时能提供援手的智慧助手？</p>
                        <p>我们是否混淆了"拥有知识文档"与"掌握并能应用知识"这两者之间的本质区别？</p>
                        <p>这些问题如同投入湖面的石子，在她心中漾起一圈圈涟漪。她想起清晨自己手足无措的窘态，想起那本翻不开的应急手册，内心深处那份对"提问"的渴望，以及对"有效获取答案"的希冀，变得愈发强烈。</p>
                        <p>日子在重复的忙碌与间歇的思考中悄然滑过。知微依然会在遇到难题时感到紧张，但与最初不同的是，她开始有意识地观察和记录。她发现，许多所谓的"突发情况"，其实都有章可循，只是相关的处理办法散落在不同的文件、通知或是老师傅们的经验之谈中。信息是碎片化的，调用是随机的。</p>
                        <p>一天深夜，结束了又一个疲惫的晚班，知微拖着沉重的步伐回到小小的出租屋。她习惯性地打开电脑，想浏览些行业资讯。屏幕右下角，一条不起眼的新闻推送跳了出来——"腾讯发布企业级智能问答与知识管理应用ima.copilot，助力构建专属AI知识库，让知识'活'起来。" </p>
                        <p>"专属AI知识库……"这几个字像一道微弱的电流，瞬间击中了她。她点开链接，详细阅读起来。报道中称，这款软件能够导入企业内部的各类文档资料，通过自然语言处理和人工智能技术，让用户以提问的方式快速获取精准信息，甚至能够根据上下文给出处理建议。</p>
                        <p>"只需提出问题，系统就能给出答案……"</p>
                        <p>那一刻，知微的心脏猛地一收缩，随即又不受控制地剧烈跳动起来。她仿佛看到漆黑隧道尽头，那一点明灭可见的希望之光。如果，如果能把航空公司那些浩如烟海的规章、流程、应急预案、签证政策都导入进去，如果它真的能像一个无所不知的专家那样，随时回答她的问题……</p>
                        <p>清晨的崩溃与无助，哲学教授的话语，连日来的困惑与质疑，此刻都汇聚成一股强烈的冲动。她几乎能想象到，当自己再次面对棘手问题时，不再是惊慌失措地翻手册，而是从容地对着一个界面，清晰地提出自己的疑问，然后，获得条理清晰、有据可依的答案。</p>
                        <p>那不仅仅是工作效率的提升，那更像是一种……解放。一种从繁杂信息和记忆重负中的解放。</p>
                        <p>她反复研读着ima.copilot的功能介绍，眼中闪烁着一种近乎执拗的光芒。一个大胆的念头，如同雨后春笋般，在她心底破土而出。</p>
                    `
                },
                {
                    id: "chapter-2",
                    title: "第二章：秘密的\"飞行计划\"",
                    content: `
                        <p>"把值机和登机环节所有相关的业务手册、规章通知、应急预案、签证政策、远机位广播规范以及行李托运异常处理办法……所有这些，都整理录入到这个AI系统里。"知微深吸一口气，尽量让自己的声音听起来平静而有条理，"这样，当我们遇到问题时，只需要像和人对话一样提出问题，系统就能根据我们导入的资料，给出相对精准的答案和政策出处，从而大大减少我们翻阅手册、或者依赖不确定记忆的时间。"</p>
                        <p>第二天一早，知微鼓足勇气，找到了当班的W主管。W主管是一位经验丰富的老地服，以严谨和铁面无私著称。她听完知微略显急促的陈述，眉头渐渐蹙了起来，眼神中带着一丝不易察觉的审视。</p>
                        <p>"小知啊，"W主管的语气不咸不淡，手指轻轻叩击着桌面，"你的想法是好的，年轻人有冲劲，想改进工作是好事。但是，别总搞这些不切实际的东西。"她顿了顿，语气加重了几分，"我们地服的工作，靠的是什么？是日积月累的经验，是把各项流程规定刻在脑子里的基本功！手册上白纸黑字写得清清楚楚，按章办事，这才是我们做好服务的基石。你说的那个什么AI，万一出错了怎么办？谁来负责？"</p>
                        <p>W主管的话像一盆冷水，浇熄了知微一半的热情。她试图辩解："主管，手册是死的，但情况是活的。而且这个系统可以标注答案出处，我们可以……"</p>
                        <p>"行了，"W主管摆摆手，打断了她，"我知道你想表现。但目前阶段，踏踏实实把业务学精，比什么都重要。这个事，先放一放吧。"</p>
                        <p>知微张了张嘴，最终还是把涌到喉头的话咽了回去。她知道，再多说也无益。W主管的顾虑并非没有道理，对于一个强调安全与规范的行业来说，任何未经充分验证的新技术的引入，都必然伴随着质疑和谨慎。</p>
                        <p>走出主管办公室，初夏的阳光有些刺眼。知微心中充满了失落，但那颗被ima.copilot点燃的火种，却并未因此熄灭，反而因为被压抑，而在心底燃烧得更加执拗。</p>
                        <p>"不切实际吗？"她在心里默默反问，"真正不切实际的，是期望每个人都把厚达数千页、并且还在不断更新的规章制度完美无缺地记在脑子里，还要在万分紧急的状况下，零差错地调取出来！"</p>
                        <p>她想起了哲学教授的话："真正的知识，在于能够持续地、深入地提出问题。" 她现在的问题是：如何让知识真正为一线人员所用？</p>
                        <p>一个大胆的、近乎叛逆的念头在她心中成型——既然无法获得正式的许可和支持，那她就偷偷地进行自己的"飞行计划"。她决定利用业余时间，先从自己最常接触、也最容易出错的登机口业务开始，尝试构建一个小型的、个人化的AI知识库。</p>
                        <p>说干就干。接下来的日子，知微像是上了发条的陀螺。白天，她依旧是那个在各个登机口忙碌穿梭的地服人员，认真工作，细心观察，但更加留意收集各类案例和问题。晚上回到家，她便一头扎进自己的"秘密基地"——那台旧笔记本电脑，以及新注册的ima.copilot账号。</p>
                        <p>起初，她以为构建知识库只是简单地将PPT、PDF、Word文档上传上去。但很快，她就遭遇了第一次"认知冲击"。当她把一本近百页的《国际旅客中转流程手册》整个儿丢给系统，然后尝试性地用自然语言提问："持有X国护照从A地经B地前往C地，24小时内不出机场需要签证吗？"系统反馈回来的，要么是一堆包含"X国护照"、"签证"、"中转"等关键词的零散段落，要么是牛头不对马嘴的模糊回答，让她哭笑不得。</p>
                        <p>"果然，AI不是神。"知微有些沮丧，但并没放弃。她意识到，自己之前的想法太过简单粗暴。ima.copilot虽然是先进的软件，但它不是魔术师，它需要被"喂食"经过精心处理和结构化的"食材"，才能烹饪出美味的"知识大餐"。她并非在'训练'一个大型语言模型，那是腾讯这种巨头才能做的事情，她是在为这款知识管理软件'构建一个清晰的'提问-回答'逻辑架构，让沉默的知识'开口说话'。</p>
                        <p>于是，她改变了策略。她不再追求一次性导入所有文档，而是开始精读每一份文件，将登机流程的每一个步骤、特殊旅客处置的每一种办法、签证政策的每一条细则、远机位登机广播的每一段标准话术，乃至行李托运异常处理的各种预案，都逐一"拆解"成具体的"问题-答案"对。</p>
                        <p>对于每一个条目，她都像一个严谨的学者般，详细标注了文件出处、更新日期、适用条件、操作步骤和关键的判别逻辑。例如，在处理签证政策时，她会将一条政策转化为："问题：旅客持有\[具体国家\]护照，计划从\[始发城市\]经由\[本站\]中转至\[目的城市\]，中转时间预计\[具体时长\]，且\[是否出机场/海关\]，请问是否需要办理过境签证？答案：根据《\[具体文件名\]》第\[X\]条第\[Y\]款规定，\[详细政策说明\]。备注：\[注意事项或例外情况\]。"</p>
                        <p>她甚至开始利用一些简单的AI文本分析小工具，辅助自己从大量文本中快速提取关键信息、进行分类和初步的结构化整理，这在一定程度上提升了她"喂养"ima.pilota的效率。</p>
                        <p>更具挑战性的是那些"隐性知识"的显性化。手册上白纸黑字的是规定，但在实际操作中，充满了各种基于经验的判断和不成文的技巧。比如，如何用几句话快速安抚焦躁的旅客？面对某种特定类型的特殊旅客，除了标准流程外还需要注意哪些细节？这些往往是新手最容易犯错，也是老员工的"不传之秘"。</p>
                        <p>为了获取这些宝贵的"活知识"，知微变得比以前更"好问"。她会抓住一切机会，向李姐和其他老师傅请教工作中遇到的各种疑难杂症，仔细聆听他们的处理方法和背后的思考逻辑。她会主动查阅过往的投诉案例和服务SOP（标准操作程序）执行报告，分析成功经验和失败教训。然后，她把这些通过请教、观察、分析得来的经验，也努力转化为结构化的语言，小心翼翼地融入到她的AI知识库中。</p>
                        <p>这已经远远超出了简单输入文档的范畴。她感觉自己像一个导师，在耐心地、细致地引导AI"学会思考"，或者更准确地说，是引导AI学会按照她设定的逻辑框架，将碎片化的信息组织起来，进行有效的关联和推理。</p>
                        <p>夜深人静，当城市早已沉睡，知微房间的灯光常常还亮着。屏幕上，ima.copilot的界面见证着她的每一次尝试、每一次失败后的调整、以及每一次微小进步带来的喜悦。她会反复用各种刁钻、模糊、甚至带有歧义的问题去"拷问"她的AI知识库，然后根据AI的回答，不断优化知识条目的描述、补充缺失的逻辑、修正错误的关联。</p>
                        <p>期间，W主管也曾不经意间察觉到知微的一些"小变化"。比如，有一次处理一个关于婴儿摇篮申请的复杂咨询，涉及到不同舱位、不同机型的细微规定，好几个老员工都说得模棱两可，知微却很快给出了一个条理清晰、引用了具体文件条款的答复，虽然她最后还是谦虚地表示"需要再和票务确认一下"，但其反应速度和准确性让W主管略感讶异，只是当时并未深究。</p>
                        <p>当她的个人知识库里成功录入并优化了第九十九个复杂问题，并且AI能够准确无误地给出符合逻辑、有明确出处的回应时，知微决定进行一次更具挑战性的测试。她深吸一口气，在对话框里郑重地敲下了第一百个问题，这个问题是她根据近期一个真实的复杂案例改编的：</p>
                        <p>"一位持有H特区护照的旅客，计划从伦敦始发，经由本站（T市）中转，搭乘12小时后的航班前往东京。他没有T市的有效签证，也不打算出机场隔离区。请问，根据最新规定，他是否需要办理过境签证？如果无需办理，依据是什么？如果有特殊豁免条款，请一并说明。"</p>
                        <p>这个问题涉及到国籍、过境政策、中转时长、是否出隔离区以及最新的豁免条款，任何一个环节判断失误，都可能导致完全不同的结论。</p>
                        <p>她屏住呼吸，按下了发送键。</p>
                        <p>几秒钟的等待，漫长得像一个世纪。</p>
                        <p>随后，AI的回答清晰地显示在屏幕上："根据您提供的信息，该旅客无需办理T市过境签证。依据如下：持H特区护照的旅客前往日本，符合T市24小时内直接过境且不出机场的免办签证政策。详情可参考《2024年度T市口岸过境免办签证政策通告（修订版）》第二部分第3条关于'特定国家和地区公民过境免签'的规定。该政策明确指出，持有H特区护照……（省略若干字）……可享受此豁免。建议在值机时提醒旅客备妥全程登机牌及有效旅行证件以备查验。"</p>
                        <p>条理清晰，逻辑严谨，有明确的文件出处和版本号，甚至还有贴心的操作建议。</p>
                        <p>知微的嘴角，慢慢绽放出一个如释重负的、欣慰的笑容。这是她第一百次正式提问，而她的AI知识库，第一次像一个真正的人类专家那样，给出了一个堪称完美的回答。</p>
                        <p>她的"飞行计划"，似乎真的要起飞了。</p>
                    `
                },
                {
                    id: "chapter-3",
                    title: "第三章：数据反击战",
                    content: `
                        <p>转眼间，知微的"飞行计划"已经秘密运行了近三个月。这三个月里，她像一只辛勤的工蜂，不断为她的AI知识库添砖加瓦，优化每一个知识节点。她的个人知识库已经积累了近三百个经过反复验证的"问题-答案"对，涵盖了登机口业务的方方面面。她自己也从最初的磕磕绊绊，到如今已经能初步熟练地运用这个"秘密武器"辅助日常工作了。</p>
                        <p>真正的考验，总是在不经意间降临。</p>
                        <p>那是一个周五的下午，T3航站楼内人潮涌动，空气中弥漫着出行旺季特有的焦灼与期待。知微负责的，恰好又是那个让她刻骨铭心的远机位登机口。一架飞往东南亚重要城市的航班即将开始登机，旅客们排起了长龙。</p>
                        <p>突然，队伍中一阵小小的骚动。一位女士操着流利的英文，语速极快地向地面引导员表达着什么，脸上带着明显的不满和困惑。引导员是一名刚入职不久的新员工，显然被这阵势问蒙了，涨红着脸，支支吾吾。</p>
                        <p>知微立刻走了过去。"Good afternoon, Madam. I'm the gate agent. Is there anything I can help you with?"她微笑着，试图用平稳的语气缓和气氛。</p>
                        <p>这位女士看上去约莫四十岁，衣着考究，气质干练。她指着自己的登机牌和护照，说道："我购买的是商务舱机票，按照贵公司的规定，我应该可以携带两件手提行李。但刚才在安检口，他们告诉我这个航班的商务舱旅客也只能携带一件，另一件必须托运。我的电脑和重要文件都在这个小行李箱里，我不能托运它。这到底是怎么回事？"</p>
                        <p>又是一个关于行李规定的"疑难杂症"。不同航线、不同舱位、不同会员等级、甚至不同执飞机型，都可能有细微的行李政策差异，这些信息散落在各个版本的《旅客运输总条件》、《地面服务手册》以及不定时更新的内部业务通告里，极易混淆。</p>
                        <p>若是三个月前，知微面对这种情况，恐怕又会陷入手忙脚乱翻手册、或者硬着头皮向上级请示的窘境。但此刻，她的心底却异常平静。</p>
                        <p>她从容地站在旅客面前，脸上依旧保持着礼貌的微笑，语气温和却不失专业："您好，女士。您反映的情况我们非常重视。请您稍等片刻，我来为您再次核实一下关于本次航班最新的手提行李规定。"</p>
                        <p>她没有像其他人预料的那样跑去翻找厚重的手册，也没有慌忙地打电话，而是不慌不忙地从口袋里掏出自己的手机，指尖在屏幕上飞快地点击了几下。她在ima.copilot的对话框里用清晰的自然语言输入了问题：</p>
                        <p>"请查询航班XXX，关于今天的商务舱旅客手提行李额度的最新规定。一位旅客认为可以携带两件，但在安检处被告知只能携带一件。如果政策有变，请一并提供对客解释口径和建议。"</p>
                        <p>几乎在她按下发送键的同时，屏幕上已经清晰地显示出AI知识库给出的答案：</p>
                        <p>"根据《\[航班号XXX\]专项服务保障通知（\[日期\]发布））》第三条第二款规定：由于今日执飞该航班的\[机型XXX\]客机行李架空间调整，自即日起，该航班所有舱位（含商务舱）旅客手提行李额统一调整为一件（体积不超过20X40X55cm，重量不超过5公斤）。超出部分需办理托运。相关解释口径请参照附件《关于特殊机型行李政策调整的旅客沟通指南》。建议：向旅客耐心解释此为特殊机型临时调整政策，并主动协助旅客办理超额行李的免费托运手续，或询问是否有小件贵重物品可取出随身携带。"</p>
                        <p>答案精准，不仅列出了政策依据、文件出处和发布日期，甚至连调整原因（机型行李架空间调整）和后续的旅客沟通话术都一并奉上。</p>
                        <p>知微抬起头，目光清澈而坚定地望向那位女士，语气比之前更加自信："女士，非常抱歉给您带来困扰。我已经查证过了，根据我们今天刚刚生效的一条针对本次航班执飞机型的专项服务通知，由于机型调整导致客舱行李架空间有所变化，因此今天所有搭乘本次航班的旅客，包括商务舱旅客，手提行李额度确实临时调整为一件。这是为了保障飞行安全和所有旅客的舒适度。您看，这是具体的通知条款。"她将手机屏幕上显示的官方文件内容，礼貌地展示给旅客过目。</p>
                        <p>随后，她按照AI提供的"沟通指南"，微笑着补充道："我非常理解您的担忧，电脑和重要文件确实不便托运。如果您不介意，您可以将电脑和文件取出随身携带，这个小行李箱我们可以为您办理免费的优先托运，确保它在您抵达目的地时能第一时间提取。您看这样可以吗？"</p>
                        <p>整个过程，从旅客提出问题到知微给出详尽解释和解决方案，不过短短一两分钟。她的应对有理有据，不卑不亢，语气诚恳，方案周到。</p>
                        <p>那位原本一脸不悦的女士，在看到手机屏幕上清晰的政策条款和知微专业而自信的解释后，脸上的疑虑和不满渐渐消散。她仔细看了看条款，又看了看知微，最终点了点头，语气也缓和下来："原来是这样，特殊情况，我理解。谢谢你，你非常专业。"她接受了知微的建议，将电脑取出，把小行李箱交给了地服人员办理托运。</p>
                        <p>一场潜在的旅客投诉，就这样被悄无声息地化解了。</p>
                        <p>站在不远处，一直默默观察着这一切的W主管，脸上写满了惊讶。她快步走了过来，趁着旅客队伍重新开始流动的间隙，低声问知微："小知，你刚才……用的是什么工具？反应这么快，条款还那么清楚。"</p>
                        <p>知微平静地将手机收回口袋，迎向主管惊讶的目光，嘴角勾起一抹浅浅的、却无比自信的微笑。她想起了自己当初的"飞行计划"，想起了那些深夜里与AI对话的瞬间。</p>
                        <p>"W姐，"她轻声说，"我没有用什么特别的工具，我只是……为我们的工作，赋予了一个能够精准'言说'和'思考'的智慧大脑。"</p>
                        <p>她知道，她的"数据反击战"，打赢了。而这，仅仅是一个开始。这不仅仅是她个人的胜利，更是对那种僵化、低效的知识调用模式的一次有力挑战。她用事实证明了，当知识能够被轻松、精准地调用时，它所能爆发出的力量，远超想象。</p>
                    `
                },
                {
                    id: "chapter-4",
                    title: "第四章：认知之翼的初展",
                    content: `
                        <p>W主管的惊讶，很快就转变成了浓厚的兴趣。在亲眼目睹了知微利用AI知识库高效解决实际问题，并且是在一个曾经让她自己也颇感棘手的行李规定争议上之后，她对这个"新玩意儿"的态度发生了180度的大转变。</p>
                        <p>那天航班任务结束后，W主管特意把知微留了下来，详细询问了关于ima.copilot的一切。知微坦诚地讲述了自己构建个人知识库的整个过程，从最初的灵感到深夜的摸索，从遭遇的困境到最终的突破，也演示了AI知识库的各项功能，尤其是它如何理解自然语言提问，如何从海量信息中快速提取并整合答案，以及那些被她"喂"进去的"隐性知识"是如何帮助AI做出更人性化判断的。</p>
                        <p>W主管听得十分专注，时不时点头，眼中闪烁着思索的光芒。她本身就是业务出身，深知一线地服工作的痛点和难点。当她看到知微提出的一个复杂场景问题，AI能在几秒钟内给出包含多个文件出处、逻辑清晰的综合性解答时，她彻底被折服了。她想起了无数次因为一个模糊不清的规定，大家手忙脚乱翻手册、打电话层层请示的狼狈场面。</p>
                        <p>"小知，你这个东西……"W主管沉吟片刻，一拍大腿，"是个好东西！是个真正能解决问题的好东西！"</p>
                        <p>很快，在W主管的积极推动和担保下，知微的"AI智慧大脑"——这个基于ima.copilot构建的登机口业务专属知识库，得以在整个地服部的登机服务岗位进行内部试点。</p>
                        <p>知微成为了这个试点项目的核心成员，负责培训其他同事如何使用这个系统，并根据大家在实际使用中遇到的问题，持续优化和扩充知识库的内容。她不再是单打独斗，部门里几位对新技术感兴趣的年轻同事也加入了进来，和她一起进行知识的梳理、标注和逻辑构建。</p>
                        <p>推广初期，并非一帆风顺。</p>
                        <p>有的老员工习惯了凭经验办事，对这个需要"提问"的新系统抱有抵触情绪，觉得是多此一举。"我干了十几年地服，什么情况没见过？还需要问电脑？"</p>
                        <p>有的年轻员工则担心过度依赖AI会让自己业务能力退化。"万一哪天没网了，或者系统崩了，我们是不是就什么都不会了？"</p>
                        <p>更有人在背后窃窃私语，带着一丝讥讽："搞这些花里胡哨的，我看她就是想偷懒，不想自己记东西罢了。"</p>
                        <p>面对这些质疑和议论，知微也曾感到委屈和压力。但每一次，当她看到同事们借助AI知识库，成功化解了一次潜在的冲突，或者快速为旅客解答了一个复杂的疑问，脸上露出释然的笑容时，她就觉得一切的努力都值得。</p>
                        <p>在一次内部业务交流会上，当又有人提出"偷懒"的质疑时，知微站了起来，目光坚定地扫过全场，一字一句地回应道："认为使用AI知识库是偷懒，这本身就是对知识和效率的误解。我们的大脑，更应该用于理解、判断、沟通和创造，而不是被迫成为一本本行走的操作手册。并非我在偷懒，而是陈旧、低效的知识调用模式，偷走了我们所有人的宝贵时间，也消耗了我们服务旅客的热情。"</p>
                        <p>她的这番话掷地有声，让会议室陷入了片刻的安静。W主管带头鼓起了掌。</p>
                        <p>渐渐地，随着AI知识库在实际工作中展现出越来越强大的优势——回答准确率高、响应速度快、覆盖面广、支持自然语言模糊查询、还能提供操作建议和沟通话术——越来越多的同事开始接受并依赖这个"新伙伴"。</p>
                        <p>班组长李姐，知微最初的师傅，如今对这个AI知识库赞不绝口："小微搞的这个AI大脑啊，说实话，比给我派十个实习生都管用！以前新来的孩子，业务不熟，遇到点特殊情况就慌神，现在好了，有疑问直接问'大脑'，答案又快又准，我省心多了！"</p>
                        <p>新员工们更是将AI知识库视为"救星"。他们不再需要在入职初期就面对海量规章制度的巨大压力，也不用担心因为一个细小条款的记忆失误而造成服务差错。他们可以将更多的精力放在学习如何与旅客有效沟通，如何处理现场的实际状况，以及最重要的——如何向AI提出一个"好问题"。</p>
                        <p>知微将自己的用户账号命名为"问者001"。在她看来，AI知识库并非要取代人工，更不是让人变得懒惰和无知。恰恰相反，它像一对翅膀，将地服人员从繁琐、重复的机械记忆中解放出来，让他们得以将宝贵的精力，真正集中在那些需要人类智慧进行分析、判断、共情和创造性解决问题的环节。</p>
                        <p>这双"认知之翼"虽然初展，但它所带来的变革，已经悄然发生。它改变的不仅仅是工作效率，更在潜移默化中，重塑着人们对于知识、对于学习、对于工具的认知。</p>
                        <p>而知微，作为"问者001"，也在这场变革的浪潮中，感受着前所未有的成长与力量。她更加深刻地理解了大学哲学教授那句话的含义——"真正的知识，在于能够持续地、深入地提出问题。"因为现在，她和她的同事们，拥有了一个能够与她们的提问产生智慧回响的"大脑"。</p>
                    `
                },
                {
                    id: "chapter-5",
                    title: "第五章：哲学的时刻",
                    content: `
                        <p>AI知识库的全面铺开和成功应用，给地服部门带来了肉眼可见的积极变化。工作效率提升了，差错率降低了，旅客满意度也随之水涨船高。但对知微而言，这场由她意外点燃的技术革新，所带来的冲击远不止于作业方式的优化，它更像一场深刻的思维结构与认知模式的重塑。</p>
                        <p>她常常在夜深人静时，回想起最初构建知识库的那些日夜。那时，她不仅仅是在录入数据，更像是在与知识本身对话，试图理解其内在的逻辑与关联。她发现，当知识不再是孤立的、僵硬的条文，而是可以被灵活调用、自由组合、并能响应具体情境的"活"信息时，它所能产生的力量是惊人的。</p>
                        <p>过去，她和同事们像是一群在知识的密林中艰难跋涉的旅人，依赖着模糊的记忆和不甚清晰的地图（操作手册），每一步都小心翼翼，却仍不免迷路或跌倒。而现在，AI知识库如同一个经验丰富的向导，又像一架高性能的无人机，能够迅速为他们勘探出最精准的路径，标记出所有的关键节点。</p>
                        <p>人类的角色，从吃力地"记住一切"，转变为聪明地"学会提问"和"有效判断"。</p>
                        <p>这种转变，让她想起了更多哲学课上的片段。关于人类认知的发展，关于工具对文明的推动，关于信息时代个体与知识的关系……那些曾经觉得遥远而抽象的理论，此刻都变得鲜活而具体。</p>
                        <p>一天，她在员工休息室的白板上，看到同事们自发贴上的一些使用AI知识库的心得和小技巧，旁边还有几句感谢的话。那一刻，一种难以言喻的感动和成就感涌上心头。她拿起笔，在白板的一角，郑重地写下了三段话，那是她这段时间以来最深刻的感悟：</p>
                        <p>其一：</p>
                        <p>我们无需再铭记每一个答案，<br>
                        只需学会，如何提出一个优质的问题。<br>
                        AI为我们承载知识的重量，<br>
                        思考的羽翼，由此得以轻盈。</p>
                        <p>其二：</p>
                        <p>智慧并非单纯的知识存储，<br>
                        亦非孤立经验的盲目累积。<br>
                        它更是高效的连接与洞察，<br>
                        在万千线索中，照亮那唯一的路径。</p>
                        <p>其三：</p>
                        <p>勿忧AI将使我们变得无知，<br>
                        它恰是认知能力的外延与增益。<br>
                        如同望远镜拓展了凝望宇宙的视野，<br>
                        AI助力我们，更擅长调配与运用智慧。</p>
                        <p>她写完，默默地看着。这不仅仅是对AI知识库的赞美，更是对一种全新学习范式和工作理念的呼唤。她终于彻底领悟——AI知识库的真正价值，并非仅仅在于它'具备多少能力'，而在于它如何'助力你拥有更强的能力'，让人类从'知识的奴隶'真正迈向'知识的主宰'。</p>
                        <p>这无疑是一场深刻的认知革命，一场从"记忆至上"、"标准答案至上"，到"提问至上"、"思考至上"、"智慧连接至上"的文明层面的转型。虽然它目前仅仅发生在小小的地服部门，但知微隐约感觉到，这背后蕴含着一种更为宏大和普遍的趋势。</p>
                        <p>她，以及所有拥抱这种变化的"问者"，都正站在这个转型浪潮的潮头。他们不再是知识的奴隶，而是开始学习如何成为知识的飞行者，驾驭着AI这对有力的翅膀，在信息的长空自由翱翔。而这一切的起点，不过是源于一个年轻人对"更好提问"的渴望，以及对"知识本该如何被对待"的朴素反思。</p>
                        <p>知微，这不仅是她的名字，更是她在这场变革中所践行的真谛——从最细微处的问题入手，洞察其本质，最终带来了显著而深刻的改变。</p>
                    `
                },
                {
                    id: "chapter-6",
                    title: "尾声：文明的分水岭",
                    content: `
                        <p>一年之后。</p>
                        <p>T3航站楼地服部门的年度总结报告上，一组数据格外引人注目：旅客对登机口服务的平均满意度评分，从去年的85.2分跃升至93.5分，创下了历史新高。因政策理解和信息传递不畅导致的旅客投诉率，同比下降了近60%。延误航班的旅客安抚及后续处置平均时间，有效缩短了30%。而新员工的岗位培训周期，更是从原来的三个月以上，大幅缩减到一个月左右即可独立上岗，且差错率远低于往年。</p>
                        <p>这些冷冰冰的数字背后，是无数个曾经可能爆发的冲突被有效化解，是无数旅客因得到及时精准的帮助而露出的满意笑容，更是地服员工们日益增长的职业认同感和工作幸福感。</p>
                        <p>AI知识库系统，早已深度融入到地服工作的每一个环节。它不再仅仅是知微和少数几人的"宝贝"，而是整个团队不可或缺的"智慧中枢"。大家已经习惯了遇到问题先"问AI"，再根据AI提供的信息进行判断和操作。当初那些质疑和担忧的声音，早已被实实在在的成效所淹没。</p>
                        <p>W主管因为这个项目的成功，获得了公司的年度创新管理奖。她在获奖感言中，特别感谢了知微，称她是"一位真正能从细微处洞察问题，并用智慧和勇气推动变革的优秀年轻人"。</p>
                        <p>这天，又一批新员工入职。带教的依然是李姐，但她的培训方式已经与一年前截然不同。她不再要求新人们死记硬背那些厚厚的规章手册，而是先教会他们如何使用AI知识库。</p>
                        <p>一个梳着马尾辫，脸上还带着些许学生气的年轻女孩，在一次模拟操作中因为对某个特殊票务规定不熟悉而出了错，显得有些沮丧。她小声地向身旁的知微请教："知微姐，这么多规章制度，还有那么多随时可能更新的临时通知，我感觉自己好像怎么也记不住，脑子完全不够用，该如何是好？"</p>
                        <p>知微看着她，仿佛看到了曾经的自己。她温和地笑了笑，从口袋里取出一个打印着二维码的小卡片递给女孩。卡片上印着AI知识库的登录方式和一句引导语："智慧的入口，始于一个好问题。"</p>
                        <p>"不必强记所有答案。"知微轻声说，她的声音里带着一种历经淬炼后的平静与智慧，"你只需要记住，当你遇到困惑时，这里有一个可靠的伙伴。然后，认真思考，学会如何清晰、准确地向它提出'好问题'。剩下的，交给它，也交给你自己基于信息的判断。"</p>
                        <p>知微望着窗外，一架银色的飞机正优雅地滑向跑道，即将腾空而起。她知道，T3航站楼的日常依旧繁忙，挑战也从未消失。但有些东西，已经不一样了。一种新的秩序，一种新的智慧生态，正在悄然生长。</p>
                        <p>这不仅仅是一个工具的胜利，这更像是一个小小的、却意义深远的文明分水岭。人类与知识的关系，正在被重新定义。</p>
                    `
                },
                {
                    id: "chapter-7",
                    title: "后记：我们终将从知识的奴隶，转变为知识的主宰",
                    content: `
                        <p>世间从不匮乏知识，无论是浩如烟海的典籍，还是日新月异的信息洪流。然而，真正匮乏的，或许是能够被我们即时理解、精准调用、并能转化为有效行动的智慧。</p>
                        <p>在过去漫长的岁月中，人类扮演着知识的承载者、记忆者，甚至在某种程度上，是知识的"奴隶"。我们为记忆力超群者赞叹，为博闻强识者折服，却也常常为自身记忆的局限和信息过载的压力而苦恼。</p>
                        <p>AI知识库的出现，恰如为这个时代量身打造的一双羽翼。它并非要取代人类的思考，而是将人类从机械记忆的沉重负担中解放出来，让我们能够站在更高、更广阔的平台上，去审视、去连接、去创造。</p>
                        <p>它让"知微"这样的新一代"问者"得以涌现。他们不再以"知道多少答案"为唯一标尺，而是更专注于"如何提出好问题"，如何从海量信息中洞察本质，如何在复杂局面下做出明智的判断。</p>
                        <p>这双羽翼，它不在九霄之上，它就在我们身边，融入日常工作的点滴。但正是它的出现，让人类在驾驭知识的道路上，首次真正拥有了从"负重前行"到"轻盈飞翔"的可能。</p>
                        <p>我们终将意识到，真正的强大，不在于记住一切，而在于懂得如何与更强大的"智慧辅助系统"协同，成为知识真正的主宰，而非其俘虏。</p>
                        <p>而这一切，都始于一次勇敢的提问，始于对"知微见著"的执着探寻，也是人类认知边界被悄然推开的时刻。</p>
                    `
                }
            ]
        };

    // --- DOM Elements ---
    let novelContentEl, tocListEl, fontSettingsBtn, fontPanel, fontSizeSlider,
        currentFontSizeNameEl, fontFamilySelector, themeCycleBtn, themeIcons,
        tocBtn, tocPanel, closeTocBtn, bookmarkBtn, bookmarksPanel,
        addCurrentBookmarkBtn, bookmarksListEl, overlay, returnToTopBtn,
        progressBar, currentYearEl, mainTitleEl;

    function cacheDOMElements() {
        novelContentEl = document.getElementById('novelContent');
        tocListEl = document.getElementById('tocList');
        fontSettingsBtn = document.getElementById('fontSettingsBtn');
        fontPanel = document.getElementById('fontPanel');
        fontSizeSlider = document.getElementById('fontSizeSlider');
        currentFontSizeNameEl = document.getElementById('currentFontSizeName');
        fontFamilySelector = document.getElementById('fontFamilySelector');
        themeCycleBtn = document.getElementById('themeCycleBtn');
        themeIcons = {
            system: document.getElementById('themeIconSystem'),
            light: document.getElementById('themeIconLight'),
            dark: document.getElementById('themeIconDark')
        };
        tocBtn = document.getElementById('tocBtn');
        tocPanel = document.getElementById('tocPanel');
        closeTocBtn = document.getElementById('closeTocBtn');
        bookmarkBtn = document.getElementById('bookmarkBtn');
        bookmarksPanel = document.getElementById('bookmarksPanel');
        addCurrentBookmarkBtn = document.getElementById('addCurrentBookmarkBtn');
        bookmarksListEl = document.getElementById('bookmarksList');
        overlay = document.getElementById('overlay');
        returnToTopBtn = document.getElementById('returnToTopBtn');
        progressBar = document.getElementById('progressBar');
        currentYearEl = document.getElementById('currentYear'); // Fallback in HTML
    }

    // --- State Variables ---
    let currentFontSizeIndex = NOVEL_READER_CONFIG.DEFAULT_FONT_SIZE_INDEX;
    let currentFontFamily = NOVEL_READER_CONFIG.FONT_FAMILIES[0].value;
    let currentTheme = NOVEL_READER_CONFIG.THEMES[NOVEL_READER_CONFIG.DEFAULT_THEME_INDEX];
    let bookmarks = [];
    let activePanel = null; // To keep track of which panel is open

    // --- Utility Functions ---
    function calculateReadingTime(text) {
        if (!text) return 0;
        const charCount = text.replace(/<[^>]+>/g, '').length;
        return Math.max(1, Math.ceil(charCount / NOVEL_READER_CONFIG.AVG_CHARS_PER_MINUTE));
    }

    function safeLocalStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("LocalStorage GET Error:", e.message);
            return null;
        }
    }

    function safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("LocalStorage SET Error:", e.message);
        }
    }
    
    function showFeedbackMessage(element, message, originalText) {
        element.textContent = message;
        setTimeout(() => {
            element.textContent = originalText;
        }, NOVEL_READER_CONFIG.FEEDBACK_MESSAGE_DURATION);
    }

    // --- Core Functions ---

    function loadNovel() {
        if (!novelContentEl || !tocListEl) return;

        // Set main page title
        document.title = `${novelData.title} - ${novelData.author}`;

        // Clear existing content (e.g., "Loading..." message)
        novelContentEl.innerHTML = '';
        tocListEl.innerHTML = '';

        const contentFragment = document.createDocumentFragment();
        const tocFragment = document.createDocumentFragment();

        // Add novel title and author to main content
        mainTitleEl = document.createElement('h1');
        mainTitleEl.className = 'text-3xl font-bold mb-2 text-center'; // Match prose h1
        mainTitleEl.textContent = novelData.title;
        contentFragment.appendChild(mainTitleEl);

        const authorEl = document.createElement('p');
        authorEl.className = 'subtitle'; // Match prose subtitle
        authorEl.textContent = `作者：${novelData.author}`;
        contentFragment.appendChild(authorEl);

        novelData.chapters.forEach(chapter => {
            const readingTime = calculateReadingTime(chapter.content);

            const chapterContainer = document.createElement('div');
            chapterContainer.id = chapter.id;
            chapterContainer.className = 'mb-12 chapter-title'; // Existing class for scroll margin

            const chapterTitleEl = document.createElement('h2');
            // Tailwind prose classes will style h2, or define in style.css if more specific needed
            chapterTitleEl.className = 'text-2xl font-semibold mb-2 border-b-2 border-gray-300 dark:border-gray-600 pb-2';
            chapterTitleEl.textContent = chapter.title;

            const readingTimeEl = document.createElement('p');
            readingTimeEl.className = 'chapter-reading-time';
            readingTimeEl.textContent = `预计阅读时间：${readingTime} 分钟`;

            const chapterContentDiv = document.createElement('div');
            chapterContentDiv.innerHTML = chapter.content; // Content is HTML

            chapterContainer.appendChild(chapterTitleEl);
            chapterContainer.appendChild(readingTimeEl);
            chapterContainer.appendChild(chapterContentDiv);
            contentFragment.appendChild(chapterContainer);

            // Create TOC item
            const tocItem = document.createElement('a');
            tocItem.href = `#${chapter.id}`;
            tocItem.innerHTML = `${chapter.title} <span class="text-xs text-gray-500 dark:text-gray-400">(${readingTime}分钟)</span>`;
            tocItem.className = 'block py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500';
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                const targetElement = document.getElementById(chapter.id);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
                closePanel(tocPanel, tocBtn);
            });
            tocFragment.appendChild(tocItem);
        });

        novelContentEl.appendChild(contentFragment);
        tocListEl.appendChild(tocFragment);
    }

    function updateThemeIcon(effectiveThemeState) { // effectiveThemeState is 'light' or 'dark'
        if (themeIcons.system) themeIcons.system.classList.add('hidden'); // Always hide system icon
        if (themeIcons.light) themeIcons.light.classList.add('hidden');
        if (themeIcons.dark) themeIcons.dark.classList.add('hidden');

        if (effectiveThemeState === 'dark') {
            if (themeIcons.dark) themeIcons.dark.classList.remove('hidden');
        } else { // Default to light (effectiveThemeState === 'light')
            if (themeIcons.light) themeIcons.light.classList.remove('hidden');
        }
    }

    function applyTheme(themeToApply) {
        currentTheme = themeToApply; // currentTheme can be 'system', 'light', or 'dark'
        let effectiveThemeForIcon = themeToApply; // This will be resolved to 'light' or 'dark' for the icon

        if (themeToApply === 'dark' || (themeToApply === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            if (themeToApply === 'system') {
                effectiveThemeForIcon = 'dark'; // System is dark, show dark icon
            }
        } else { // themeToApply is 'light' or (themeToApply is 'system' and system is light)
            document.documentElement.classList.remove('dark');
            if (themeToApply === 'system') {
                effectiveThemeForIcon = 'light'; // System is light, show light icon
            }
        }
        safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.THEME, themeToApply); // Save the actual preference ('system', 'light', or 'dark')
        updateThemeIcon(effectiveThemeForIcon); // Update icon based on effective appearance
    }

    function cycleTheme() {
        let newTheme;
        if (currentTheme === 'system') {
            // If current effective theme is dark (system is dark), switch to light mode
            // If current effective theme is light (system is light), switch to dark mode
            newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
        } else if (currentTheme === 'light') {
            newTheme = 'dark';
        } else { // currentTheme === 'dark'
            newTheme = 'light';
        }
        applyTheme(newTheme);
    }

    function updateFontSize() {
        if (!novelContentEl || !currentFontSizeNameEl || !fontSizeSlider) return;
        const selectedSize = NOVEL_READER_CONFIG.FONT_SIZES[currentFontSizeIndex];
        novelContentEl.style.fontSize = `${selectedSize.size}px`;
        currentFontSizeNameEl.textContent = selectedSize.name;
        fontSizeSlider.value = currentFontSizeIndex;
        safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.FONT_SIZE_INDEX, currentFontSizeIndex.toString());
    }

    function populateFontFamilySelector() {
        if (!fontFamilySelector) return;
        fontFamilySelector.innerHTML = '<option disabled selected value="">— 选择字体 —</option>'; // Clear and add placeholder
        NOVEL_READER_CONFIG.FONT_FAMILIES.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.name;
            fontFamilySelector.appendChild(optElement);
        });
    }

    function applyFontFamily(fontFamily) {
        if (!novelContentEl || !fontFamilySelector) return;
        currentFontFamily = fontFamily;
        document.body.style.fontFamily = fontFamily; // Apply to the whole body
        novelContentEl.style.fontFamily = fontFamily; // Explicitly set for novel content as well, in case of specific prose styles
        safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.FONT_FAMILY, fontFamily);
        fontFamilySelector.value = fontFamily; // Ensure selector reflects current font
    }

    // --- Panel Management ---
    function openPanel(panel, button) {
        if (!panel) return;

        // Close any other open panel first
        if (activePanel && activePanel !== panel) {
            const otherButton = document.querySelector(`[aria-controls="${activePanel.id}"]`);
            closePanel(activePanel, otherButton);
        }
        
        panel.classList.remove(panel.id === 'tocPanel' ? 'toc-panel-hidden' : 'settings-panel-hidden');
        panel.classList.add(panel.id === 'tocPanel' ? 'toc-panel-visible' : 'settings-panel-visible');
        if (button) button.setAttribute('aria-expanded', 'true');
        
        if (panel.id === 'tocPanel') {
            overlay.classList.remove('overlay-hidden');
            overlay.classList.add('overlay-visible');
        } else { // Small panels don't use the main overlay to allow interaction with content
            overlay.classList.remove('overlay-visible');
            overlay.classList.add('overlay-hidden');
        }
        activePanel = panel;
        panel.focus(); // Move focus to the panel
    }

    function closePanel(panel, button) {
        if (!panel) return;

        panel.classList.remove(panel.id === 'tocPanel' ? 'toc-panel-visible' : 'settings-panel-visible');
        panel.classList.add(panel.id === 'tocPanel' ? 'toc-panel-hidden' : 'settings-panel-hidden');
        if (button) {
            button.setAttribute('aria-expanded', 'false');
            button.focus(); // Return focus to the button that opened it
        }

        if (panel.id === 'tocPanel') {
            overlay.classList.remove('overlay-visible');
            overlay.classList.add('overlay-hidden');
        }
        if (activePanel === panel) {
            activePanel = null;
        }
    }

    function togglePanel(panel, button) {
        if (!panel) return;
        const isHidden = panel.classList.contains(panel.id === 'tocPanel' ? 'toc-panel-hidden' : 'settings-panel-hidden') || 
                         !panel.classList.contains(panel.id === 'tocPanel' ? 'toc-panel-visible' : 'settings-panel-visible');

        if (isHidden) {
            openPanel(panel, button);
            if (panel === bookmarksPanel) loadBookmarks(); // Refresh bookmarks when opening
        } else {
            closePanel(panel, button);
        }
    }


    // --- Bookmarks ---
    function getVisibleChapterInfo() {
        let visibleChapter = null;
        let maxVisibility = 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        if (!novelData.chapters || novelData.chapters.length === 0) return null;

        for (const chapter of novelData.chapters) {
            const el = document.getElementById(chapter.id);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Consider chapter visible if its top is within the first 2/3 of viewport
                // or if a significant part of it is visible.
                const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
                
                if (visibleHeight > 0) {
                     // Prioritize chapter whose start is near the top or middle of the viewport
                    if (rect.top >= 0 && rect.top < viewportHeight * 0.66) {
                         return { id: chapter.id, title: chapter.title, element: el };
                    }
                    if (visibleHeight > maxVisibility) {
                        maxVisibility = visibleHeight;
                        visibleChapter = { id: chapter.id, title: chapter.title, element: el };
                    }
                }
            }
        }
        // Fallback to the first chapter if none are prominently visible
        return visibleChapter || { id: novelData.chapters[0].id, title: novelData.chapters[0].title, element: document.getElementById(novelData.chapters[0].id) };
    }

    function addBookmark() {
        if (!addCurrentBookmarkBtn) return;

        const visibleChapterInfo = getVisibleChapterInfo();
        if (!visibleChapterInfo || !visibleChapterInfo.element) {
            showFeedbackMessage(addCurrentBookmarkBtn, "无法确定章节", "添加当前位置为书签");
            return;
        }

        const { id: chapterId, title: chapterTitle, element } = visibleChapterInfo;
        const scrollY = window.scrollY;
        const timestamp = new Date().toISOString();
        
        let previewText = "章节起始...";
        if (element) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = element.innerHTML; // Get content of the chapter div
            const firstP = tempDiv.querySelector('p:not(.chapter-reading-time)'); // Get first actual content paragraph
            if (firstP) {
                 previewText = firstP.textContent.trim().substring(0, 50) + "...";
            }
        }


        if (bookmarks.find(b => b.chapterId === chapterId && Math.abs(b.scrollY - scrollY) < 50)) {
            showFeedbackMessage(addCurrentBookmarkBtn, "附近已有书签", "添加当前位置为书签");
            return;
        }

        bookmarks.push({ chapterId, chapterTitle, scrollY, timestamp, previewText });
        try {
            safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
            loadBookmarks(); // Refresh list
            showFeedbackMessage(addCurrentBookmarkBtn, "书签已添加!", "添加当前位置为书签");
        } catch (e) {
            showFeedbackMessage(addCurrentBookmarkBtn, "添加失败", "添加当前位置为书签");
            console.error("Failed to save bookmark:", e);
        }
    }

    function loadBookmarks() {
        if (!bookmarksListEl) return;
        bookmarksListEl.innerHTML = ''; // Clear existing

        if (bookmarks.length === 0) {
            bookmarksListEl.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">暂无书签。</p>';
            return;
        }

        const sortedBookmarks = [...bookmarks].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const fragment = document.createDocumentFragment();

        sortedBookmarks.forEach((bookmark, index) => {
            const bookmarkEl = document.createElement('div');
            bookmarkEl.className = 'relative p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500';
            bookmarkEl.setAttribute('role', 'listitem');
            bookmarkEl.tabIndex = 0; // Make it focusable

            const titleEl = document.createElement('p');
            titleEl.className = 'font-semibold text-sm truncate pr-8'; // Added pr-8 for delete button space
            titleEl.textContent = bookmark.chapterTitle || '未知章节';

            const previewEl = document.createElement('p');
            previewEl.className = 'text-xs text-gray-500 dark:text-gray-400 mt-1 truncate';
            previewEl.textContent = bookmark.previewText || '';

            const dateEl = document.createElement('p');
            dateEl.className = 'text-xs text-gray-400 dark:text-gray-500 mt-1';
            try {
                dateEl.textContent = `添加于: ${new Date(bookmark.timestamp).toLocaleDateString()}`;
            } catch (e) {
                 dateEl.textContent = `添加于: 无效日期`;
            }


            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-red-500 hover:text-red-700"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.03 3.22.077m3.22-.077L11.778 4.511a2.25 2.25 0 0 0-2.244-1.5H8.084a2.25 2.25 0 0 0-2.244 1.5L4.772 5.79m14.456 0-3.272 13.883" /></svg>`;
            deleteBtn.className = 'absolute top-1/2 right-2 transform -translate-y-1/2 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full';
            deleteBtn.setAttribute('aria-label', `删除书签: ${bookmark.chapterTitle}`);
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                bookmarks = bookmarks.filter(b => b.timestamp !== bookmark.timestamp);
                safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
                loadBookmarks(); // Refresh list
            };
            
            bookmarkEl.append(titleEl, previewEl, dateEl, deleteBtn);
            bookmarkEl.addEventListener('click', () => {
                window.scrollTo({ top: bookmark.scrollY, behavior: 'smooth' });
                closePanel(bookmarksPanel, bookmarkBtn);
            });
            bookmarkEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.scrollTo({ top: bookmark.scrollY, behavior: 'smooth' });
                    closePanel(bookmarksPanel, bookmarkBtn);
                }
            });
            fragment.appendChild(bookmarkEl);
        });
        bookmarksListEl.appendChild(fragment);
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        themeCycleBtn.addEventListener('click', cycleTheme);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (currentTheme === 'system') applyTheme('system');
        });

        fontSizeSlider.addEventListener('input', (e) => {
            currentFontSizeIndex = parseInt(e.target.value, 10);
            updateFontSize();
        });

        fontFamilySelector.addEventListener('change', (e) => {
            applyFontFamily(e.target.value);
        });

        // Panel Toggles
        fontSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(fontPanel, fontSettingsBtn);
        });
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(bookmarksPanel, bookmarkBtn);
        });
        tocBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(tocPanel, tocBtn);
        });
        closeTocBtn.addEventListener('click', () => closePanel(tocPanel, tocBtn));
        
        overlay.addEventListener('click', () => {
             if (tocPanel.classList.contains('toc-panel-visible')) {
                closePanel(tocPanel, tocBtn);
            }
        });

        // Global click to close small panels (font, bookmarks) and share popup
        document.addEventListener('click', (e) => {
            if (activePanel && activePanel !== tocPanel && !activePanel.contains(e.target)) {
                const controllingButton = document.querySelector(`[aria-controls="${activePanel.id}"]`);
                if (controllingButton && !controllingButton.contains(e.target)) {
                    closePanel(activePanel, controllingButton);
                }
            }
        });
        
        // Keyboard accessibility for panels
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (activePanel) {
                    const controllingButton = document.querySelector(`[aria-controls="${activePanel.id}"]`);
                    closePanel(activePanel, controllingButton);
                }
            }
        });


        addCurrentBookmarkBtn.addEventListener('click', addBookmark);

        window.addEventListener('scroll', () => {
            if (window.scrollY > NOVEL_READER_CONFIG.SCROLL_SHOW_TOP_BTN_THRESHOLD) {
                returnToTopBtn.classList.add('show');
            } else {
                returnToTopBtn.classList.remove('show');
            }

            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = (docHeight > 0 ? (scrollTop / docHeight) : 0) * 100;
            progressBar.style.width = `${scrollPercent}%`;

        }, { passive: true }); // Use passive listener for scroll

        returnToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Initialization ---
    function init() {
        cacheDOMElements(); // Get all DOM elements first

        if (currentYearEl) { // Check if element exists
            currentYearEl.textContent = new Date().getFullYear().toString();
        }
        
        loadNovel();

        // Load Theme
        const savedTheme = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.THEME) || NOVEL_READER_CONFIG.THEMES[NOVEL_READER_CONFIG.DEFAULT_THEME_INDEX];
        const savedThemeIndex = NOVEL_READER_CONFIG.THEMES.indexOf(savedTheme);
        currentTheme = NOVEL_READER_CONFIG.THEMES[savedThemeIndex !== -1 ? savedThemeIndex : NOVEL_READER_CONFIG.DEFAULT_THEME_INDEX];
        applyTheme(currentTheme);
        
        // Load Font Size
        fontSizeSlider.max = (NOVEL_READER_CONFIG.FONT_SIZES.length - 1).toString();
        const savedFontSizeIndexStr = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.FONT_SIZE_INDEX);
        const savedFontSizeIndex = parseInt(savedFontSizeIndexStr, 10);
        if (!isNaN(savedFontSizeIndex) && savedFontSizeIndex >= 0 && savedFontSizeIndex < NOVEL_READER_CONFIG.FONT_SIZES.length) {
            currentFontSizeIndex = savedFontSizeIndex;
        } else {
            currentFontSizeIndex = NOVEL_READER_CONFIG.DEFAULT_FONT_SIZE_INDEX;
        }
        updateFontSize();

        // Load Font Family
        populateFontFamilySelector();
        const savedFontFamily = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.FONT_FAMILY) || NOVEL_READER_CONFIG.FONT_FAMILIES[0].value;
        applyFontFamily(savedFontFamily);

        // Load Bookmarks
        try {
            const savedBookmarks = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.BOOKMARKS);
            if (savedBookmarks) {
                bookmarks = JSON.parse(savedBookmarks);
            }
        } catch (e) {
            console.error("Failed to load bookmarks:", e);
            bookmarks = []; // Reset to empty if parsing fails
        }
        loadBookmarks();
        
        setupEventListeners(); // Setup all event listeners after DOM is ready and elements are cached
    }

    // Defer initialization until the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOMContentLoaded has already fired
        init();
    }

})(); // IIFE End
