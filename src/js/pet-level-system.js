(function () {
  const pad=level=>String(Math.max(1,Math.min(50,Number(level)||1))).padStart(2,'0');
  const stages=[
    {name:'Bé Con',icon:'🍼',skill:'Làm quen âm thanh, từ đầu tiên và lời chào.'},
    {name:'Chập Chững',icon:'🌱',skill:'Nghe, nhắc lại và phản xạ bằng câu ngắn.'},
    {name:'Hiếu Kỳ',icon:'🔎',skill:'Quan sát tranh, tìm từ và đặt câu hỏi.'},
    {name:'Học Viên',icon:'🎒',skill:'Ghép từ, đọc câu và xây mẫu câu đúng.'},
    {name:'Nhà Thám Hiểm',icon:'🧭',skill:'Dùng tiếng Anh để vượt nhiệm vụ theo Unit.'},
    {name:'Dũng Cảm',icon:'🛡️',skill:'Xử lý câu hỏi khó và đối đầu Boss ngữ pháp.'},
    {name:'Học Giả',icon:'📚',skill:'Đọc hiểu, viết ý và giải thích lựa chọn.'},
    {name:'Thủ Lĩnh',icon:'👑',skill:'Giao tiếp chủ động và hỗ trợ bạn học.'},
    {name:'Anh Hùng',icon:'🏆',skill:'Vận dụng tổng hợp nghe, nói, đọc và viết.'},
    {name:'Huyền Thoại',icon:'✨',skill:'Làm chủ thử thách nâng cao và tốt nghiệp.'}
  ];
  const ranks=['Khởi hành','Lấp lánh','Nhanh nhẹn','Tự tin','Tỏa sáng'];
  const profiles={
    milo:{name:'Milo',signature:'Năng lượng Cáo Cam',accent:'#ff8a2b',trait:'dũng cảm'},
    luna:{name:'Luna',signature:'Phép Màu Trăng Non',accent:'#b48cff',trait:'tinh tế'},
    bingo:{name:'Bingo',signature:'Nhịp Chân Vui Vẻ',accent:'#f3b43f',trait:'vui vẻ'},
    hapi:{name:'Hapi',signature:'Gai Sao Ham Học',accent:'#7bc96f',trait:'kiên trì'},
    piko:{name:'Piko',signature:'Bước Trượt Băng Xanh',accent:'#4cb9d8',trait:'thân thiện'},
    nami:{name:'Nami',signature:'Đuôi Chớp Tốc Độ',accent:'#e9784d',trait:'nhanh nhẹn'},
    koby:{name:'Koby',signature:'Ôm Mây Bình Tĩnh',accent:'#8ba7a4',trait:'điềm tĩnh'},
    rocky:{name:'Rocky',signature:'Sức Mạnh Núi Nâu',accent:'#a86c45',trait:'mạnh mẽ'},
    deerly:{name:'Deerly',signature:'Ánh Rừng Dịu Dàng',accent:'#d79a70',trait:'dịu dàng'},
    leo:{name:'Leo',signature:'Tiếng Gầm Tự Tin',accent:'#df9e35',trait:'tự tin'},
    sunny:{name:'Sunny',signature:'Tia Nắng Sáng Tạo',accent:'#f4a23c',trait:'sáng tạo'},
    wolfy:{name:'Wolfy',signature:'Dấu Chân Khám Phá',accent:'#768da9',trait:'khám phá'},
    ollie:{name:'Ollie',signature:'Đôi Cánh Thông Thái',accent:'#7567b2',trait:'thông thái'}
  };
  const rawActivities=[
    ['👋','Chào bạn đầu tiên','wave','✨','Hello, friend!'],
    ['😊','Vẫy tay và mỉm cười','sway','💛','Wave and say hello!'],
    ['👂','Đôi tai lắng nghe','listen','🎵','Listen carefully!'],
    ['💬','Nói tên của mình','talk','💬','Say your name!'],
    ['🌟','Cú nhảy vui vẻ','hop','⭐','Jump for joy!'],
    ['🔢','Bước chân đếm số','march','🔢','Count with me!'],
    ['👉','Chạm và chỉ đúng','point','👉','Touch and point!'],
    ['🖼️','Thợ săn bức tranh','dash','🔎','Find the picture!'],
    ['👏','Vỗ nhịp âm tiết','clap','🎶','Clap the syllables!'],
    ['🌀','Xoay vòng nụ cười','spin','✨','Spin and smile!'],
    ['🎧','Theo dấu âm thanh','listen','🎧','Follow the sound!'],
    ['🔤','Chỉ đúng từ mới','point','🔤','Point to the word!'],
    ['💡','Nghĩ rồi trả lời','think','💡','Think, then answer!'],
    ['📖','Đọc to rõ ràng','read','📖','Read it aloud!'],
    ['🔠','Đánh vần cùng bạn','spell','🔠','Spell it with me!'],
    ['☁️','Bay lên mây chữ','float','☁️','Float to the cloud!'],
    ['🥁','Diễu hành đếm số','march','🥁','March and count!'],
    ['👏','Vỗ tay và nhắc lại','clap','🎵','Clap and repeat!'],
    ['🎶','Nhảy theo nhịp câu','dance','🎶','Dance to the rhythm!'],
    ['🏅','Chiếc cúp đầu tiên','celebrate','🏅','Win the first trophy!'],
    ['🗺️','Mở bản đồ Unit','scout','🗺️','Open the map!'],
    ['🌉','Nhảy qua cầu từ','hop','🌉','Hop across the bridge!'],
    ['🧭','Đi theo la bàn','scout','🧭','Follow the compass!'],
    ['🌊','Vượt sông từ vựng','dash','💦','Cross the word river!'],
    ['⛺','Dựng trại câu hoàn chỉnh','build','⛺','Build a sentence camp!'],
    ['🛡️','Giơ khiên đáp án','hero','🛡️','Raise the shield!'],
    ['⚡','Né đáp án sai','dodge','⚡','Dodge the wrong answer!'],
    ['🚀','Nạp năng lượng ngữ pháp','power','🚀','Power up your grammar!'],
    ['🔑','Giải cứu từ còn thiếu','rescue','🔑','Rescue the missing word!'],
    ['🐲','Đánh bại Mini Boss','boss','🔥','Defeat the mini boss!'],
    ['📚','Mở sách phép thuật','read','📚','Open the magic book!'],
    ['✍️','Viết dòng bí mật','write','✍️','Write the secret line!'],
    ['🧩','Giải câu đố từ','think','🧩','Solve the word puzzle!'],
    ['🧠','Nhớ đúng mẫu câu','memory','🧠','Remember the pattern!'],
    ['🎨','Trình bày dự án','present','🎨','Present your project!'],
    ['👑','Dẫn đầu đội học','lead','👑','Lead the learning team!'],
    ['🤝','Giúp bạn cùng tiến','team','🤝','Help your friends!'],
    ['🚩','Cắm cờ tiếng Anh','hero','🚩','Raise the English flag!'],
    ['📣','Huấn luyện nhà thám hiểm','coach','📣','Coach the next explorer!'],
    ['🎊','Diễu hành chiến thắng','parade','🎊','Join the victory parade!'],
    ['🦸','Giọng nói Anh Hùng','hero','🦸','Use your hero voice!'],
    ['🪽','Bay qua câu chuyện','float','🪽','Fly through the story!'],
    ['🌩️','Phá sấm ngữ pháp','power','🌩️','Break the grammar thunder!'],
    ['🌠','Thu thập từ ngôi sao','dash','🌠','Collect the star words!'],
    ['🏆','Ăn mừng đại thắng','celebrate','🏆','Celebrate your victory!'],
    ['💫','Bật chế độ Huyền Thoại','legend','💫','Enter legend mode!'],
    ['🌀','Mở cổng ngôn ngữ','portal','🌀','Open the language portal!'],
    ['🌌','Du hành thiên hà từ vựng','galaxy','🌌','Travel across the galaxy!'],
    ['🎓','Chuẩn bị tốt nghiệp','parade','🎓','Prepare for graduation!'],
    ['👑','Lễ đăng quang Level 50','legend','👑','You are an English legend!']
  ];
  const posePatterns={
    wave:['wave','idle','wave','talk','idle'],
    sway:['idle','wave','idle','wave'],
    listen:['idle','talk','idle','talk'],
    talk:['talk','idle','talk','talk','idle'],
    hop:['idle','wave','idle','wave','idle'],
    march:['wave','idle','wave','idle','talk'],
    point:['wave','idle','talk','wave','idle'],
    dash:['idle','wave','idle','talk','idle'],
    clap:['wave','talk','wave','idle'],
    spin:['wave','idle','wave','talk','idle'],
    think:['talk','idle','talk','idle'],
    read:['talk','idle','talk','talk','idle'],
    spell:['talk','wave','talk','idle'],
    float:['idle','wave','talk','idle'],
    dance:['wave','idle','wave','talk','wave','idle'],
    celebrate:['wave','wave','idle','talk','wave','idle'],
    scout:['idle','wave','talk','idle','wave'],
    build:['talk','idle','wave','talk','idle'],
    hero:['idle','wave','wave','talk','idle'],
    dodge:['idle','wave','idle','wave','talk','idle'],
    power:['talk','wave','idle','wave','talk','idle'],
    rescue:['wave','talk','idle','wave','idle'],
    boss:['idle','talk','wave','wave','idle'],
    write:['talk','idle','talk','wave','idle'],
    memory:['talk','idle','wave','talk','idle'],
    present:['talk','wave','talk','idle'],
    lead:['wave','talk','wave','idle','wave'],
    team:['wave','idle','talk','wave','idle'],
    coach:['talk','wave','talk','idle','wave'],
    parade:['wave','idle','wave','talk','wave','idle'],
    legend:['idle','wave','talk','wave','wave','idle'],
    portal:['idle','talk','wave','idle','wave'],
    galaxy:['wave','idle','talk','wave','idle']
  };
  const familyMap={
    listen:'sway',point:'sway',clap:'hop',spell:'talk',scout:'dash',build:'think',
    write:'think',memory:'think',present:'talk',lead:'hero',team:'sway',coach:'talk',
    boss:'hero',rescue:'dash',portal:'spin',galaxy:'float',legend:'hero',parade:'dance'
  };
  const expertEvolutionPets=new Set(['luna','bingo','hapi','piko','nami','koby','rocky','deerly','leo','sunny','wolfy','ollie']);
  const visualMilestones=[
    {stage:1,min:1,max:10,name:'Baby'},
    {stage:2,min:11,max:20,name:'Curious'},
    {stage:3,min:21,max:35,name:'Student'},
    {stage:4,min:36,max:45,name:'Captain'},
    {stage:5,min:46,max:50,name:'Legend'}
  ];
  const visualMilestoneForLevel=level=>visualMilestones.find(item=>level>=item.min&&level<=item.max)||visualMilestones[0];
  function getLevelData(id,level){
    const safe=Math.max(1,Math.min(50,Number(level)||1));
    const stageIndex=Math.floor((safe-1)/5),rankIndex=(safe-1)%5;
    const profile=profiles[id]||profiles.milo;
    const activity=rawActivities[safe-1];
    const rawFamily=activity[2],family=familyMap[rawFamily]||rawFamily;
    const direction=safe%2?1:-1;
    const growthPercent=Math.round(55+(safe-1)*45/49);
    const visualMilestone=visualMilestoneForLevel(safe);
    const bodyScale=.9+(safe-1)*.1/49;
    const frameHeight=Math.round(248+(safe-1)*112/49);
    const cardWidth=Math.round(304+(safe-1)*76/49);
    const imagePadding=Math.round(24-(safe-1)*16/49);
    return{
      id,level:safe,profile,stageIndex,rankIndex,
      stage:stages[stageIndex],
      visualMilestone,
      growthPercent,
      appearanceName:`${stages[stageIndex].name} · ${ranks[rankIndex]}`,
      activityName:`${profile.signature}: ${activity[1]}`,
      activityShort:activity[1],
      icon:activity[0],fx:activity[3],phrase:activity[4],
      family,
      poses:posePatterns[rawFamily]||posePatterns[family]||posePatterns.wave,
      duration:1450+(safe%5)*170+stageIndex*35,
      lift:8+rankIndex*3+Math.floor(stageIndex/2),
      shift:5+(safe%6)*2,
      tilt:(3+(safe%5))*direction,
      scale:bodyScale,
      bodyScale,
      frameHeight,
      cardWidth,
      imagePadding,
      sceneRadius:22+Math.floor(stageIndex/2)*2,
      accent:profile.accent,
      skill:`${stages[stageIndex].skill} Hoạt động Level ${safe}: ${activity[1]}.`
    };
  }
  function poseImage(id,level,pose='idle'){
    if(expertEvolutionPets.has(id)){
      const milestone=visualMilestoneForLevel(Math.max(1,Math.min(50,Number(level)||1)));
      return`pet-assets/expert/${id}/stage-${String(milestone.stage).padStart(2,'0')}.webp`;
    }
    const safePose=['idle','talk','wave'].includes(pose)?pose:'idle';
    return`pet-assets/levels/${id}/lv-${pad(level)}-${safePose}.webp`;
  }
  function applyMotionStyle(element,spec){
    if(!element||!spec)return;
    element.dataset.motionFamily=spec.family;
    element.dataset.growthStage=String(spec.visualMilestone.stage);
    element.dataset.growthEra=spec.visualMilestone.name;
    element.style.setProperty('--level-accent',spec.accent);
    element.style.setProperty('--activity-duration',`${spec.duration}ms`);
    element.style.setProperty('--activity-lift',`${spec.lift}px`);
    element.style.setProperty('--activity-shift',`${spec.shift}px`);
    element.style.setProperty('--activity-tilt',`${spec.tilt}deg`);
    element.style.setProperty('--activity-scale',String(spec.scale));
    element.style.setProperty('--pet-body-scale',String(spec.bodyScale));
    element.style.setProperty('--pet-frame-height',`${spec.frameHeight}px`);
    element.style.setProperty('--pet-card-width',`${spec.cardWidth}px`);
    element.style.setProperty('--pet-padding',`${spec.imagePadding}px`);
    element.style.setProperty('--pet-scene-radius',`${spec.sceneRadius}px`);
  }
  window.MILO_PET_LEVELS={
    stages,ranks,profiles,activities:rawActivities,visualMilestones,
    getLevelData,poseImage,applyMotionStyle
  };
})();
