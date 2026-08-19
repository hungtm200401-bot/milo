(function () {
  const data=window.MILO_CURRICULUM;
  const params=new URLSearchParams(location.search);
  const state={
    grade:[2,3,4,5].includes(Number(params.get('grade')))?Number(params.get('grade')):3,
    unit:Math.max(0,Math.min(11,Number(params.get('unit'))||0)),
    part:location.hash.slice(1)||localStorage.getItem(`milo-last-part-${[2,3,4,5].includes(Number(params.get('grade')))?Number(params.get('grade')):3}-${Math.max(0,Math.min(11,Number(params.get('unit'))||0))}`)||'warmup',
    quiz:[],question:0,score:0,shield:3,combo:0,
    wordIndex:0,wordUnlocked:false,wordCompleted:[],
    grammarLevel:0,grammarCompleted:[],
    gameMode:'hunt',gameRound:0,gameScore:0,
    matchPage:0,matchOpen:[],matchDone:[],matchCards:[],
    sentenceRound:0,sentenceScore:0,
    testAnswers:[],testLocked:false
  };
  let navExpanded=false;
  const modules=Object.entries(window.MILO_LESSON_MODULES).map(([id,meta])=>[id,...meta]);
  const learningParts=()=>activeModules().filter(item=>!['test','sourcebook','vipmax'].includes(item[0])).map(item=>item[0]);
  const bossNames=['Mây Quên Lãng','Quái Vật Lộn Số','Bóng Ma Thời Gian','Mây Mù Tinh Nghịch','Cú Đêm Giấu Ảnh','Bụi Gai Cáu Kỉnh','Yêu Tinh Bừa Bộn','Vua Bóng Tối','Robot Lỗi','Đầu Bếp Hỗn Loạn','Lốc Xoáy Tím','Rồng Ngữ Pháp'];
  const bossIcons=['🌩️','🌀','⏳','🌫️','🦉','🌵','👾','🐲','🤖','🧑‍🍳','🌪️','🐲'];
  const bossRewards=['Khăn choàng Cầu Vồng','Huy hiệu Đồng Hồ','Túi Kho Báu','Mũ Học Giả','Khung Ảnh Trái Tim','Vòng Hoa Hạnh Phúc','Gối Ngôi Sao','Tai Cáo Dũng Cảm','Kính Phi Công','Mũ Đầu Bếp','Ô Mây Xanh','Áo Choàng Thủ Lĩnh'];
  const $=selector=>document.querySelector(selector);
  const appViewUrl=view=>`index.html?view=${encodeURIComponent(view)}&grade=${state.grade}&unit=${state.unit}`;
  function syncAppShellLinks(){
    localStorage.setItem('milo-grade',String(state.grade));
    localStorage.setItem(`milo-unit-${state.grade}`,String(state.unit));
    localStorage.setItem('milo-main-view','journey');
    const back=$('#lessonBackLink');
    if(back)back.href=appViewUrl('journey');
    document.querySelectorAll('[data-shell-view]').forEach(link=>{link.href=appViewUrl(link.dataset.shellView)});
  }
  const currentGrade=()=>data[state.grade];
  const currentUnit=()=>currentGrade().units[state.unit];
  const currentProfile=()=>window.MILO_GRADE_ROADMAP[state.grade];
  const exactTranscriptionEntry=section=>window.MILO_SOURCE_EXACT_TRANSCRIPTIONS?.entries?.find(entry=>entry.grade===section?.grade&&entry.unit===section?.unit&&entry.sectionId===section?.id)||null;
  const applyExactTranscription=section=>{
    const exactVerification=exactTranscriptionEntry(section);
    if(!exactVerification)return section;
    const complete=exactVerification.coverage==='complete_visible_section';
    const{sourceText:_unreviewedOcr,...safeSectionContent}=section.content||{};
    return{
      ...section,
      verificationStatus:complete?'verified_from_image':section.verificationStatus,
      content:{...safeSectionContent,...(exactVerification.content||{})},
      exactVerification
    };
  };
  const sourceUnitSpec=()=>{
    const spec=window.MILO_SOURCE_SECTIONS_V60_17?.grades?.[String(state.grade)]?.units?.[state.unit]||null;
    return spec?{...spec,sections:(spec.sections||[]).map(applyExactTranscription)}:null;
  };
  const progression=window.MILO_UNIT_PROGRESSION;
  const requestedUnitNumber=state.unit+1;
  if(progression&&!progression.isUnitUnlocked(state.grade,requestedUnitNumber)){state.unit=Math.max(0,progression.summary(state.grade).currentUnit-1);}
  if(progression)progression.setCurrentUnit(state.grade,state.unit+1);
  const requiredProgressSections=()=>{
    const spec=sourceUnitSpec();
    if(spec&&[2,3].includes(state.grade))return spec.sections.filter(section=>!['test','sourcebook','milo-grammar-levels'].includes(section.id)).map(section=>section.id);
    return learningParts();
  };
  const sourceSectionIcons={
    'Big Question':'❓','Vocabulary 1':'📗','Vocabulary 2':'📘','Vocabulary in Reading':'🔎','Pronunciation':'🔤',
    'Grammar 1':'🧠','Grammar Practice 1':'🧩','Grammar 2':'🧠','Grammar Practice 2':'🧩','Grammar Review':'🚀',
    'Listening':'🎧','Speaking/Communication':'💬','Reading 1':'📖','Reading 2':'📚','Reading Skill':'🧭',
    'Writing':'✍️','Writing Skill':'📝','Value':'💛','CLIL/Content':'🌍','Culture':'🏛️','Project':'🎨','Review/Unit Check':'✅','Khác':'📕'
  };
  const sourceModules=()=>{
    const spec=sourceUnitSpec();
    if(!spec)return null;
    const result=[];
    spec.sections.forEach(section=>{
      if(section.id==='test'){
        result.push([section.id,'✅',section.title,'Chỉ dùng kiến thức đã xác minh']);
        return;
      }
      if(section.id==='sourcebook'){
        result.push([section.id,'📕',section.title,`${section.content?.imageCount||0} ảnh nguồn của Unit`]);
        return;
      }
      if(section.id==='milo-grammar-levels'){
        result.push([section.id,'🚀',section.title,'Ôn tập thêm theo Unit']);
        return;
      }
      result.push([section.id,sourceSectionIcons[section.sectionType]||'📘',section.title,section.contentOrigin==='book_source'?'Bài học theo Unit':'Luyện tập thêm']);
    });
    const sourcebookIndex=result.findIndex(item=>item[0]==='sourcebook');
    const extras=[
      ['vipmax','👑','VIP PRO MAX · Luyện thêm Milo','Cá nhân hóa ngoài nội dung sách'],
      ['games','🎮','Game Zone · Luyện thêm Milo','Ôn tập đúng phạm vi Unit']
    ];
    if(sourcebookIndex>=0)result.splice(sourcebookIndex,0,...extras);else result.push(...extras);
    return result;
  };
  const activeModules=()=>{
    const dynamic=sourceModules();
    if(dynamic&&[2,3].includes(state.grade))return dynamic;
    return currentProfile().order.map(id=>modules.find(item=>item[0]===id)).filter(Boolean).map(item=>{
      if(item[0]!=='sourcebook')return item;
      if(state.grade===2)return [item[0],item[1],'Sách nguồn 181 ảnh','Toàn bộ nội dung 2 ZIP'];
      if(state.grade===3)return [item[0],item[1],'Sách nguồn 190 ảnh','Toàn bộ nội dung anh_tam(3).zip'];
      return item;
    });
  };
  if(!activeModules().some(item=>item[0]===state.part))state.part=activeModules()[0]?.[0]||'warmup';
  const companionProfiles={
    2:{milo:'Milo',luna:'Luna',bingo:'Bingo',hapi:'Hapi'},
    3:{milo:'Milo',piko:'Piko',nami:'Nami',koby:'Koby'},
    4:{milo:'Milo',rocky:'Rocky',deerly:'Deerly',leo:'Leo'},
    5:{milo:'Milo',sunny:'Sunny',wolfy:'Wolfy',ollie:'Ollie'}
  };
  const companionId=()=>{const saved=localStorage.getItem(`milo-selected-pet-${state.grade}`)||'milo';return companionProfiles[state.grade][saved]?saved:'milo'};
  const companionName=()=>companionProfiles[state.grade][companionId()];
  const gradeGames={
    2:{hunt:16,match:10,sentence:6},
    3:{hunt:24,match:14,sentence:10},
    4:{hunt:32,match:18,sentence:14},
    5:{hunt:40,match:22,sentence:18}
  };
  function miloJourneyLevel(){
    return window.MILO_UNIT_PROGRESSION?.summary(state.grade).level||1;
  }
  const companionLevelSpec=()=>window.MILO_PET_LEVELS.getLevelData(companionId(),miloJourneyLevel());
  function miloEvolutionImage(){
    return window.MILO_PET_LEVELS.poseImage(companionId(),miloJourneyLevel(),'idle');
  }
  function miloWaveImage(){
    return window.MILO_PET_LEVELS.poseImage(companionId(),miloJourneyLevel(),'wave');
  }
  function playCoachLevelActivity(){
    const spec=companionLevelSpec(),image=$('#lessonCoachImage'),stage=image.closest('.coach-image');
    clearInterval(window.__coachLevelPoseTimer);clearTimeout(window.__coachLevelStopTimer);
    window.MILO_PET_LEVELS.applyMotionStyle(stage,spec);
    stage.classList.add('playing-level-activity');
    let frame=0;
    const show=()=>{image.src=window.MILO_PET_LEVELS.poseImage(companionId(),spec.level,spec.poses[frame++%spec.poses.length])};
    show();
    window.__coachLevelPoseTimer=setInterval(show,Math.max(180,Math.round(spec.duration/spec.poses.length)));
    setMilo(`${spec.icon} ${companionName()} đang chơi “${spec.activityShort}”. ${spec.phrase}`);
    speak(spec.phrase,.78);
    window.__coachLevelStopTimer=setTimeout(()=>{clearInterval(window.__coachLevelPoseTimer);stage.classList.remove('playing-level-activity');image.src=miloEvolutionImage()},spec.duration);
  }
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const enc=value=>encodeURIComponent(String(value));
  function alignmentWords(unit){
    return unit.fullKnowledge?.sourceTerms||unit.alignment?.extendedWords||[];
  }
  function alignmentWordBank(unit){
    const alignment=unit.alignment;
    if(!alignment)return'';
    const knowledge=unit.fullKnowledge;
    const total=alignmentWords(unit).length;
    const mastered=new Set(JSON.parse(localStorage.getItem(`milo-source-mastery-${state.grade}-${state.unit}`)||'[]'));
    const sourceByTerm=new Map((knowledge?.sourceTerms||[]).map(item=>[String(item.term).toLowerCase(),item]));
    return`<details class="scope-word-bank">
      <summary><span>📚</span><div><b>Toàn bộ từ/cụm từ đọc được từ nguồn</b><small>${unit.words.length} từ học nhanh · ${total} mục từ có nghĩa, phát âm và trạng thái học</small></div><em>Mở xem</em></summary>
      <div class="scope-word-intro"><b>Học ngắn, nhưng không bỏ sót</b><p>Nghe → đọc nghĩa → đánh dấu “Đã nhớ”. Mục màu tím là từ trọng tâm; các mục còn lại giúp đọc hiểu và vận dụng đúng chủ đề.</p></div>
      <div class="scope-vocabulary-groups">${alignment.vocabularyGroups.map(group=>`<article><div><b>${esc(sourceByTerm.get(String(group.terms[0]||'').toLowerCase())?.groupVi||group.label)}</b><span>${group.terms.length} mục</span></div><section>${group.terms.map(term=>{const item=sourceByTerm.get(String(term).toLowerCase());if(!item)return'';return`<div class="scope-term ${item.active?'active':''} ${mastered.has(item.id)?'mastered':''}"><button type="button" data-say="${enc(item.term)}" aria-label="Nghe ${esc(item.term)}">🔊</button><div><b>${esc(item.term)}</b><small>${esc(item.meaning)}</small><em>${item.exampleType==='milo-authored-practice'?'Ví dụ luyện Milo':'Ví dụ trọng tâm'}: ${esc(item.example)}</em></div><label><input type="checkbox" data-source-mastered="${esc(item.id)}" ${mastered.has(item.id)?'checked':''}><span>Đã nhớ</span></label></div>`}).join('')}</section></article>`).join('')}</div>
    </details>`;
  }
  function alignmentObjectives(unit){
    const objectives=unit.alignment?.objectives;
    if(!objectives)return'';
    const labels={grammar:['🧠','Cấu trúc'],listening:['🎧','Nghe'],reading:['📖','Đọc'],speaking:['💬','Nói'],writing:['✍️','Viết']};
    return`<details class="scope-objectives">
      <summary><span>✅</span><div><b>Mục tiêu cần đạt của Unit</b><small>Đối chiếu đủ cấu trúc và bốn kỹ năng</small></div><em>Mở xem</em></summary>
      <div>${Object.entries(objectives).map(([key,value])=>`<article><span>${labels[key]?.[0]||'•'}</span><div><b>${labels[key]?.[1]||esc(key)}</b><p>${esc(value)}</p></div></article>`).join('')}</div>
    </details>`;
  }
  function sourceLessonMap(unit){
    const pack=unit.lessonPack;
    if(!pack?.coverage?.length)return'';
    return`<section class="unit-source-map">
      <div class="unit-source-map-head"><div><span class="card-label">LỘ TRÌNH UNIT ĐÃ ĐỐI CHIẾU</span><h2>Học đủ 8 bước, mỗi lần một việc</h2></div><b>${esc(pack.sourceLabel)} · trang ${esc(pack.sourcePages)}</b></div>
      <div class="unit-source-steps">${pack.coverage.map((item,index)=>`<article><span>${item.icon}</span><small>BƯỚC ${index+1}</small><b>${esc(item.title)}</b><p>${esc(item.goal)}</p></article>`).join('')}</div>
    </section>`;
  }
  function sourceKnowledgePanel(unit){
    const knowledge=unit.fullKnowledge;
    if(!knowledge)return'';
    return`<details class="source-knowledge-panel" open>
      <summary><span>🔎</span><div><b>Kiến thức đã truy vết từ hai ZIP</b><small>Trang ${esc(knowledge.printedPages)} · ${knowledge.sourceTermCount} mục từ · 2 bài đọc</small></div><em>Đã xác minh</em></summary>
      <div class="source-evidence-grid">${knowledge.readings.map(reading=>`<article><span>READING ${reading.index}</span><h3>${esc(reading.title)}</h3><p>${esc(reading.verifiedSummary)}</p><small>${esc(reading.source)}</small></article>`).join('')}</div>
      <div class="source-skill-grid"><article><b>🧠 Ngữ pháp</b><p>${esc(knowledge.grammarFocus.join(' · '))}</p></article><article><b>💬 Kỹ năng</b><p>${esc(knowledge.skills.join(' · '))}</p></article><article><b>💛 Giá trị</b><p>${esc(knowledge.value)}</p></article><article><b>🎨 Vận dụng</b><p>${esc(knowledge.project)}</p></article></div>
      <p class="source-limit-note"><b>Âm thanh gốc: ${esc(knowledge.sourceAudio.status)}</b> — ${esc(knowledge.sourceAudio.reason)} Phần nghe hiện tại là nội dung Milo biên soạn và giọng đọc trên máy.</p>
    </details>`;
  }
  const testQuestionTarget=unit=>state.grade===2&&unit.fullKnowledge?36:(unit.expert?.standard?.testItems||({2:24,3:32,4:40,5:48}[state.grade]));
  const shuffle=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy};
  const uniqueOptions=(correct,pool)=>shuffle([correct,...pool].filter((value,index,array)=>value&&array.indexOf(value)===index).slice(0,4));
  const dateKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function readDaily(){
    const saved=JSON.parse(localStorage.getItem('milo-daily-progress')||'null');
    return saved&&saved.date===dateKey()?saved:{date:dateKey(),words:0,gameCorrect:0,parts:0,quizCorrect:0};
  }
  function recordDaily(action,amount=1){
    const today=dateKey(),yesterdayDate=new Date();yesterdayDate.setDate(yesterdayDate.getDate()-1);
    const last=localStorage.getItem('milo-last-study-date');
    let streak=Number(localStorage.getItem('milo-study-streak')||0);
    if(last!==today){
      streak=last===dateKey(yesterdayDate)?streak+1:1;
      localStorage.setItem('milo-study-streak',String(streak));
      localStorage.setItem('milo-last-study-date',today);
    }
    const daily=readDaily();daily[action]+=amount;
    localStorage.setItem('milo-daily-progress',JSON.stringify(daily));
    const coinReward={words:2,gameCorrect:3,parts:12,quizCorrect:4}[action]||0;
    localStorage.setItem('milo-care-coins',String(Number(localStorage.getItem('milo-care-coins')||0)+coinReward*amount));
    updateRewardHud();
  }
  function updateRewardHud(){
    const daily=readDaily();
    const points=daily.words*5+daily.gameCorrect*10+daily.parts*25+daily.quizCorrect*5;
    if($('#lessonStreak'))$('#lessonStreak').textContent=localStorage.getItem('milo-study-streak')||'0';
    if($('#lessonDailyPoints'))$('#lessonDailyPoints').textContent=points;
    if($('#lessonMiloCoins'))$('#lessonMiloCoins').textContent=localStorage.getItem('milo-care-coins')||'0';
  }

  function lessonKey(){return`milo-lesson-parts-${state.grade}-${state.unit}`}
  function doneParts(){return JSON.parse(localStorage.getItem(lessonKey())||'[]')}
  function savePart(part){
    if(!learningParts().includes(part))return;
    const previous=doneParts();
    if(!previous.includes(part))recordDaily('parts');
    const next=[...new Set([...previous,part])];
    localStorage.setItem(lessonKey(),JSON.stringify(next));
    setMilo('Xong một chặng rồi! Em đang tiến bộ rất tốt.');
    updateHeader();
    renderNav();
    const button=$('[data-complete]');
    if(button){button.textContent='✓ Đã học xong phần này';button.classList.add('done')}
  }
  function speak(text,rate=.84){
    $('#miloMessage').textContent=text;
    document.body.classList.add('milo-speaking');
    clearTimeout(window.__miloSpeakingTimer);
    window.__miloSpeakingTimer=setTimeout(()=>document.body.classList.remove('milo-speaking'),Math.min(4200,Math.max(1500,String(text).length*48)));
    if(window.MILO_PET_VOICE){window.MILO_PET_VOICE.speak(text,rate);return}
    if(!('speechSynthesis'in window))return;
    speechSynthesis.cancel();
    let spoken=false;
    const run=()=>{
      if(spoken)return;
      spoken=true;
      speechSynthesis.removeEventListener('voiceschanged',run);
      const isVi=/[À-ỹĐđ]/.test(text),line=new SpeechSynthesisUtterance(text),voices=speechSynthesis.getVoices(),prefix=isVi?'vi':'en';
      const preferred=isVi?['HoaiMy','Hoài My','Linh','Vietnamese Female','Vietnamese']:['Microsoft Ana Online','Microsoft Ana','Microsoft Jenny Online','Jenny','Microsoft Aria Online','Aria','Microsoft Ava Online','Ava','Samantha','Zira','Google US English','Female'];
      line.lang=isVi?'vi-VN':'en-US';line.rate=Math.min(rate,isVi?.82:.8);line.pitch=isVi?1.18:1.27;line.volume=1;
      line.voice=preferred.map(name=>voices.find(voice=>voice.lang.toLowerCase().startsWith(prefix)&&voice.name.toLowerCase().includes(name.toLowerCase()))).find(Boolean)||voices.find(voice=>voice.lang.toLowerCase().startsWith(isVi?'vi-vn':'en-us'))||voices.find(voice=>voice.lang.toLowerCase().startsWith(prefix))||null;
      speechSynthesis.speak(line);
    };
    if(speechSynthesis.getVoices().length)run();else{speechSynthesis.addEventListener('voiceschanged',run);setTimeout(run,220)}
  }
  function setMilo(text){$('#miloMessage').textContent=text}
  function contextSentence(word,unit){
    const sentences=unit.sample.match(/[^.!?]+[.!?]?/g)||[unit.sample];
    return(sentences.find(sentence=>sentence.toLowerCase().includes(word.toLowerCase()))||`Listen, point and say: ${word}.`).trim();
  }
  function wordExamples(word,unit){
    const first=word[3]||contextSentence(word[0],unit);
    const second=word[4]||(unit.pattern[1].toLowerCase().includes(word[0].toLowerCase())?unit.pattern[1]:`Today I learn and use the word “${word[0]}”.`);
    return[first,second];
  }
  function wordTask(word,index,unit,otherUnits){
    const otherWords=otherUnits.flatMap(item=>item.words),examples=wordExamples(word,unit),type=index%4;
    if(type===0)return{label:'CHỌN NGHĨA',prompt:`“${word[0]}” có nghĩa là gì?`,answer:word[1],options:uniqueOptions(word[1],otherWords.map(item=>item[1]))};
    if(type===1)return{label:'NGHE VÀ NHẬN RA TỪ',prompt:`Nghe ${companionName()} đọc rồi chọn đúng từ.`,answer:word[0],options:uniqueOptions(word[0],unit.words.map(item=>item[0])),audio:word[0]};
    if(type===2){
      const blank=examples[0].toLowerCase().includes(word[0].toLowerCase())?examples[0].replace(new RegExp(word[0],'i'),'_____'):'Listen, point and say: _____.';
      return{label:'ĐIỀN TỪ VÀO CÂU',prompt:blank,answer:word[0],options:uniqueOptions(word[0],unit.words.map(item=>item[0]))};
    }
    return{label:'CHỌN CÂU DÙNG ĐÚNG',prompt:`Câu nào dùng “${word[0]}” đúng với chủ đề bài học?`,answer:examples[0],options:uniqueOptions(examples[0],otherWords.map(item=>wordExamples(item,unit)[0]))};
  }
  function renderWordTrainer(){
    const unit=currentUnit(),grade=currentGrade(),otherUnits=grade.units.filter((_,index)=>index!==state.unit);
    const word=unit.words[state.wordIndex],examples=wordExamples(word,unit),task=wordTask(word,state.wordIndex,unit,otherUnits);
    const completed=state.wordCompleted.includes(state.wordIndex),finished=state.wordCompleted.length===unit.words.length;
    $('#wordTrainer').innerHTML=
      `<section class="word-trainer"><div class="word-trainer-progress"><div><b>Từ ${state.wordIndex+1}/${unit.words.length}</b><span>${state.wordCompleted.length*5} XP đã nhận</span></div><div class="word-progress-track"><i style="width:${state.wordCompleted.length/unit.words.length*100}%"></i></div></div>`+
      `<div class="word-stage"><button class="word-motion-scene palette-${state.wordIndex%4}" data-word-say="${enc(word[0])}" data-rate=".82" aria-label="Ảnh động minh họa từ ${esc(word[0])}. Chạm để nghe."><span class="scene-sun">☀️</span><span class="scene-cloud cloud-a">☁️</span><span class="scene-cloud cloud-b">☁️</span><span class="scene-spark spark-a">✦</span><span class="scene-spark spark-b">✦</span><span class="scene-spark spark-c">✦</span><strong class="scene-word-hero">${word[2]}</strong><span class="scene-milo">🦊</span><span class="scene-grass"></span><small>ẢNH SỐNG · CHẠM ĐỂ NGHE</small><em>0${state.wordIndex+1}</em></button><div class="word-teaching"><span class="card-label">TỪ MỚI HÔM NAY</span><h2>${esc(word[0])}</h2><p class="word-meaning">${esc(word[1])}</p><div class="button-row"><button class="primary-button" data-word-say="${enc(word[0])}" data-rate=".8">🔊 Nghe từ</button><button class="secondary-button" data-word-say="${enc(word[0])}" data-rate=".52">🐢 Nghe chậm</button></div></div></div>`+
      `<div class="word-examples"><div class="word-examples-title"><span>💡</span><div><b>Học qua ví dụ</b><p>Nghe, đọc theo rồi quan sát vị trí của từ mới.</p></div></div>${examples.map((example,index)=>`<div class="example-row"><span>${index+1}</span><p>${esc(example)}</p><button data-word-say="${enc(example)}" data-rate="${index?'.76':'.68'}">🔊</button></div>`).join('')}</div>`+
      `<div class="instant-practice"><div class="instant-practice-title"><span>⚡ ÁP DỤNG NGAY</span><b>${task.label}</b></div><h3>${esc(task.prompt)}</h3>${task.audio?`<button class="audio-button" data-word-say="${enc(task.audio)}" data-rate=".68">🔊 Nghe ${companionName()} đọc</button>`:''}<div class="answer-grid">${task.options.map(option=>`<button class="answer ${completed&&option===task.answer?'correct':''}" data-word-choice="${enc(option)}">${esc(option)}</button>`).join('')}</div><p class="unlock-note ${completed?'ready':''}" id="wordUnlockNote">${completed?`✓ Chính xác! Từ “${esc(word[0])}” đã được ghi nhớ.`:'🔒 Trả lời đúng bài áp dụng để mở từ tiếp theo.'}</p></div>`+
      `<div class="word-trainer-footer"><div class="word-dots">${unit.words.map((item,index)=>`<button class="${index===state.wordIndex?'active':''} ${state.wordCompleted.includes(index)?'done':''}" data-word-index="${index}" aria-label="Từ ${index+1}"></button>`).join('')}</div>${finished?`<button class="primary-button" id="restartWords">🎉 Học lại ${unit.words.length} từ</button>`:`<button class="primary-button" id="nextWord" ${state.wordUnlocked?'':'disabled'}>${state.wordIndex===unit.words.length-1?'Hoàn thành bộ từ ✓':'Từ tiếp theo →'}</button>`}</div></section>`;
    document.querySelectorAll('[data-word-say]').forEach(button=>button.onclick=()=>speak(decodeURIComponent(button.dataset.wordSay),Number(button.dataset.rate||.82)));
    document.querySelectorAll('[data-word-choice]').forEach(button=>button.onclick=()=>{
      const value=decodeURIComponent(button.dataset.wordChoice);
      if(value===task.answer){
        state.wordUnlocked=true;
        if(!state.wordCompleted.includes(state.wordIndex))recordDaily('words');
        state.wordCompleted=[...new Set([...state.wordCompleted,state.wordIndex])];
        setMilo(`Excellent! Em đã dùng đúng từ “${word[0]}”. +5 XP`);
        speak(`Excellent! ${word[0]}.`);
        renderWordTrainer();
      }else{
        button.classList.add('wrong');
        setMilo('Chưa đúng. Em nghe hoặc xem lại ví dụ rồi thử lại nhé.');
        speak('Good try. Please listen and try again.');
      }
    });
    document.querySelectorAll('[data-word-index]').forEach(button=>button.onclick=()=>{
      const index=Number(button.dataset.wordIndex);
      if(state.wordCompleted.includes(index)||index<=state.wordIndex){
        state.wordIndex=index;state.wordUnlocked=state.wordCompleted.includes(index);renderWordTrainer();
      }
    });
    $('#nextWord')?.addEventListener('click',()=>{
      if(!state.wordUnlocked)return;
      if(state.wordIndex<unit.words.length-1){state.wordIndex++;state.wordUnlocked=false;renderWordTrainer();speak(unit.words[state.wordIndex][0],.68)}
    });
    $('#restartWords')?.addEventListener('click',()=>{state.wordIndex=0;state.wordUnlocked=false;state.wordCompleted=[];renderWordTrainer()});
  }
  function sentenceBuilder(sentence){
    const target=sentence.replace(/[.!?]$/g,'');
    const tokens=shuffle(target.split(/\s+/));
    return`<section class="sentence-builder" id="sentenceBuilder" data-target="${enc(target)}"><div class="exercise-title"><span>🧱</span><b>Sắp xếp thành câu đúng</b></div><p>Chạm từng thẻ theo đúng thứ tự:</p><div class="sentence-line" id="sentenceLine"><em>Câu của em sẽ hiện ở đây…</em></div><div class="token-bank">${tokens.map((token,index)=>`<button data-token="${enc(token)}" data-token-id="${index}">${esc(token)}</button>`).join('')}</div><div class="button-row"><button class="primary-button" id="checkSentence" disabled>Kiểm tra</button><button class="secondary-button" id="resetSentence">Làm lại</button></div><p class="answer-note" id="sentenceNote"></p></section>`;
  }
  function grammarLevels(unit){
    if(window.MILO_EXPERT_PROGRAM)return window.MILO_EXPERT_PROGRAM.grammarLevels(unit,state.grade);
    const keyword=unit.words[0][0];
    return[
      {title:'Từ và trật tự câu',badge:'FOUNDATION',rule:'Câu tiếng Anh thường đi theo trật tự: Chủ ngữ + động từ + thông tin.',formula:'S + V + O',examples:[`I can say “${keyword}”.`,`We learn about ${unit.title.toLowerCase()}.`,'Milo helps me practise English.'],question:'Chọn câu có trật tự đúng.',answer:`I can say “${keyword}”.`,options:[`I can say “${keyword}”.`,`Can I “${keyword}” say.`,`Say I can “${keyword}”.`,`“${keyword}” I say can.`]},
      {title:'Mẫu câu giao tiếp',badge:'CORE PATTERN',rule:explainPattern(unit.pattern[0]),formula:'Question ↔ Complete answer',examples:[unit.pattern[0],unit.pattern[1],`Milo asks: “${unit.pattern[0]}”`],question:unit.pattern[0],answer:unit.pattern[1],options:uniqueOptions(unit.pattern[1],[`This is ${unit.words[1][0]}.`,`I can see ${unit.words[2][0]}.`,`There are ${unit.words[3][0]}.`])},
      {title:'Số lượng và đơn vị',badge:'ENHANCED',rule:'Dùng từ chỉ đơn vị trước danh từ: a pair of, a pack of, a piece of, a bar of.',formula:'a/an + unit + of + noun',examples:['a pair of shoes','a pack of cookies','a piece of paper','a bar of chocolate'],question:'Chọn cụm đúng để nói “một đôi giày”.',answer:'a pair of shoes',options:['a pair of shoes','a pack of shoes','a bar of shoes','a piece shoes']},
      {title:'Thì và từ nối',badge:'BRIDGE',rule:'Dùng trạng từ thời gian để chọn thì; nối hai ý bằng and, but, because hoặc so.',formula:'Time signal + correct tense + connector',examples:[`Today I learn about ${unit.title.toLowerCase()}.`,`Yesterday I learned the word “${keyword}”.`,'I practise because I want to speak clearly.'],question:'Yesterday, I ___ English with Milo.',answer:'practised',options:['practised','practise','will practise','practising']},
      {title:'Câu mở rộng nâng cao',badge:'CHALLENGE',rule:'Kết hợp điều kiện, so sánh hoặc mệnh đề quan hệ để diễn đạt một ý dài hơn.',formula:'If + present, will + verb',examples:['If I practise every day, I will speak more confidently.',`The word that I remember best is “${keyword}”.`,'This task is more difficult, but it is also more interesting.'],question:'If I study carefully, I ___ the test.',answer:'will pass',options:['will pass','passed yesterday','passing','will passed']}
    ].map((level,index)=>({...level,title:currentProfile().grammar[index]}));
  }
  function renderGrammarLab(){
    const unit=currentUnit(),levels=grammarLevels(unit),level=levels[state.grammarLevel],enhanced=Boolean(unit.grammarFocus?.length);
    const unlocked=index=>index===0||state.grammarCompleted.includes(index-1);
    const otherExamples=levels.filter((_,index)=>index!==state.grammarLevel).flatMap(item=>item.examples);
    const checks=[
      {label:'1 · HIỂU QUY TẮC',question:level.question,answer:level.answer,options:level.options},
      {label:'2 · NHẬN RA CÂU ĐÚNG',question:'Chọn câu dùng đúng cấu trúc của Level này.',answer:level.examples[0],options:uniqueOptions(level.examples[0],otherExamples)},
      {label:'3 · NHỚ CÔNG THỨC',question:'Công thức nào thuộc Level này?',answer:level.formula,options:uniqueOptions(level.formula,levels.filter((_,index)=>index!==state.grammarLevel).map(item=>item.formula))}
    ];
    $('#grammarLab').innerHTML=
      `<section class="grammar-lab"><div class="grammar-journey-visual"><img src="grammar-level-islands.webp" alt="Năm đảo ngữ pháp từ cơ bản đến nâng cao"><div><span class="card-label">ENHANCED GRAMMAR PATH</span><h2>Leo từ Level 1 đến Level 5</h2><p>Mỗi Level có công thức, ví dụ và bài kiểm tra mở khóa. Lớp ${state.grade} được khuyến nghị học chắc đến Level ${Math.min(5,Math.max(2,state.grade))}.</p></div></div>`+
      `<div class="grammar-level-tabs">${levels.map((item,index)=>`<button class="${state.grammarLevel===index?'active':''} ${state.grammarCompleted.includes(index)?'done':''} ${!unlocked(index)?'locked':''}" data-grammar-level="${index}"><span>${state.grammarCompleted.includes(index)?'✓':!unlocked(index)?'🔒':index+1}</span><div><b>Level ${index+1}</b><small>${esc(item.title)}</small></div></button>`).join('')}</div>`+
      `<div class="grammar-level-card"><div class="grammar-rule"><span>${level.badge}</span><h2>Level ${state.grammarLevel+1} · ${esc(level.title)}</h2><p>${esc(level.rule)}</p><div class="grammar-formula">${esc(level.formula)}</div></div><div class="grammar-examples"><span class="card-label">VÍ DỤ TĂNG DẦN</span>${level.examples.map((example,index)=>`<button data-grammar-say="${enc(example)}"><span>${index+1}</span><b>${esc(example)}</b><em>🔊</em></button>`).join('')}</div></div>`+
      `<div class="grammar-check-stack">${checks.map((check,index)=>`<div class="grammar-mastery" data-grammar-check="${index}" data-correct="${enc(check.answer)}"><div><span>🧠 ${check.label}</span><h3>${esc(check.question)}</h3></div><div class="answer-grid">${check.options.map(option=>`<button class="answer" data-grammar-choice="${enc(option)}">${esc(option)}</button>`).join('')}</div><p class="answer-note"></p></div>`).join('')}</div>`+
      `${enhanced?`<div class="enhanced-sample-pack"><div><span class="card-label">${esc(unit.reference)}</span><h3>Ngữ pháp đúng trọng tâm Unit</h3><p>${unit.grammarFocus.map(item=>esc(item)).join(' · ')}. Nội dung luyện tập do Milo biên soạn mới.</p></div><div class="enhanced-word-bank">${unit.words.map(word=>`<button data-grammar-say="${enc(word[0])}"><span>${word[2]}</span><b>${esc(word[0])}</b><small>${esc(word[1])}</small></button>`).join('')}</div></div>`:''}</section>`;
    document.querySelectorAll('[data-grammar-say]').forEach(button=>button.onclick=()=>speak(decodeURIComponent(button.dataset.grammarSay)));
    document.querySelectorAll('[data-grammar-level]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.grammarLevel);if(unlocked(index)){state.grammarLevel=index;renderGrammarLab()}else setMilo(`Hãy hoàn thành Grammar Level ${index} trước để mở khóa.`)});
    document.querySelectorAll('[data-grammar-choice]').forEach(button=>button.onclick=()=>{
      const card=button.closest('[data-grammar-check]'),value=decodeURIComponent(button.dataset.grammarChoice),correct=decodeURIComponent(card.dataset.correct),note=card.querySelector('.answer-note');
      if(value===correct){
        card.dataset.done='1';button.classList.add('correct');note.textContent='✓ Chính xác!';note.className='answer-note good';
        card.querySelectorAll('[data-grammar-choice]').forEach(item=>item.disabled=true);
        if([...document.querySelectorAll('[data-grammar-check]')].every(item=>item.dataset.done==='1')){
          state.grammarCompleted=[...new Set([...state.grammarCompleted,state.grammarLevel])];
          setMilo(`Grammar Level ${state.grammarLevel+1} complete! Em đã vượt đủ 3 bước và mở khóa Level ${Math.min(5,state.grammarLevel+2)}.`);
          speak('Excellent grammar work!');
          setTimeout(renderGrammarLab,700);
        }
      }else{button.classList.add('wrong');note.textContent='Chưa đúng. Đọc lại công thức và ví dụ rồi thử lại.';note.className='answer-note bad';setMilo('Chưa đúng. Em nhìn công thức, nghe lại ví dụ và thử thêm lần nữa nhé.')}
    });
  }
  function renderGameBoard(){
    const unit=currentUnit(),source=unit.words,board=$('#gameBoard');
    if(state.gameMode==='hunt'){
      const rounds=gradeGames[state.grade].hunt;
      if(state.gameRound>=rounds){
        board.innerHTML=`<div class="game-finish"><span>🏆</span><h3>Hoàn thành ${rounds} vòng săn từ!</h3><p>Em đạt ${state.gameScore} điểm. Hãy chơi lại để đổi thứ tự câu hỏi.</p><button class="primary-button" id="restartHunt">Chơi lại ${rounds} vòng</button></div>`;
        $('#restartHunt').onclick=()=>{state.gameRound=0;state.gameScore=0;renderGameZone()};
        return;
      }
      const target=source[state.gameRound%source.length],type=state.gameRound%3;
      const answer=type===1?target[1]:target[0];
      const prompt=type===0?target[1]:type===1?target[0]:`Nghe ${companionName()} đọc và chọn đúng từ`;
      const options=uniqueOptions(answer,source.map(word=>type===1?word[1]:word[0]));
      board.innerHTML=`<div class="game-road"><span class="game-road-milo" style="left:${Math.max(4,state.gameRound/rounds*90)}%"><img src="${miloEvolutionImage()}" alt=""></span><i style="width:${state.gameRound/rounds*100}%"></i><b>🏁</b></div><div class="picture-hunt-game"><div class="game-prompt-world"><span class="game-star star-a">✨</span><span class="game-star star-b">🌟</span><strong>${target[2]}</strong><em><img src="${miloEvolutionImage()}" alt=""></em></div><div class="picture-prompt"><div><small>ROUND ${state.gameRound+1}/${rounds}</small><h3>${esc(prompt)}</h3><button data-game-say="${enc(target[0])}">🔊 ${companionName()} đọc gợi ý</button></div></div><div class="answer-grid">${options.map(option=>`<button class="answer" data-hunt-choice="${enc(option)}">${esc(option)}</button>`).join('')}</div></div>`;
      $('[data-game-say]').onclick=()=>speak(decodeURIComponent($('[data-game-say]').dataset.gameSay));
      document.querySelectorAll('[data-hunt-choice]').forEach(button=>button.onclick=()=>{const value=decodeURIComponent(button.dataset.huntChoice);if(value===answer){document.querySelectorAll('[data-hunt-choice]').forEach(item=>item.disabled=true);state.gameScore+=10;recordDaily('gameCorrect');button.classList.add('correct');setMilo(`Đúng rồi! +10 vỏ sò. Tổng điểm: ${state.gameScore}.`);speak(target[0]);setTimeout(()=>{state.gameRound++;renderGameZone()},650)}else{button.classList.add('wrong');setMilo('Chưa đúng. Hãy nhìn hình, nghe lại rồi chọn lần nữa.')}});
    }
    if(state.gameMode==='match'){
      const totalPairs=Math.min(gradeGames[state.grade].match,source.length),pages=Math.ceil(totalPairs/6),pageWords=source.slice(state.matchPage*6,Math.min(totalPairs,state.matchPage*6+6));
      if(!state.matchCards.length)state.matchCards=shuffle(pageWords.flatMap((word,key)=>[{id:key*2,key,label:`${word[2]} ${word[0]}`},{id:key*2+1,key,label:word[1]}]));
      const pageComplete=state.matchDone.length===pageWords.length;
      board.innerHTML=`<div class="memory-game"><div class="memory-instruction"><b>Bản đồ ${state.matchPage+1}/${pages} · Nối ${pageWords.length} cặp</b><span>Mỗi cặp đúng được giữ lại và phát sáng trên bàn.</span></div><div class="memory-grid">${state.matchCards.map(card=>{const visible=state.matchOpen.includes(card.id)||state.matchDone.includes(card.key);return`<button class="${visible?'open':''} ${state.matchDone.includes(card.key)?'matched':''}" data-match-card="${card.id}">${visible?esc(card.label):'?'}</button>`}).join('')}</div>${pageComplete?`<div class="match-page-finish"><b>✨ Hoàn thành bản đồ ${state.matchPage+1}!</b><button class="primary-button" id="nextMatchPage">${state.matchPage<pages-1?'Sang bản đồ tiếp →':'Chơi lại hai bản đồ'}</button></div>`:''}</div>`;
      document.querySelectorAll('[data-match-card]').forEach(button=>button.onclick=()=>{const id=Number(button.dataset.matchCard);if(state.matchOpen.length===2||state.matchOpen.includes(id))return;const card=state.matchCards.find(item=>item.id===id);if(!card||state.matchDone.includes(card.key))return;state.matchOpen.push(id);if(state.matchOpen.length===2){const one=state.matchCards.find(item=>item.id===state.matchOpen[0]),two=state.matchCards.find(item=>item.id===state.matchOpen[1]);if(one.key===two.key){setTimeout(()=>{state.matchDone=[...new Set([...state.matchDone,one.key])];state.matchOpen=[];recordDaily('gameCorrect');setMilo('Match! Em đã nối đúng từ và nghĩa.');renderGameZone()},350)}else setTimeout(()=>{state.matchOpen=[];renderGameZone()},750)}renderGameBoard()});
      $('#nextMatchPage')?.addEventListener('click',()=>{state.matchPage=state.matchPage<pages-1?state.matchPage+1:0;state.matchOpen=[];state.matchDone=[];state.matchCards=[];renderGameZone()});
    }
    if(state.gameMode==='sentence'){
      const sentenceTarget=gradeGames[state.grade].sentence;
      const sentences=[unit.pattern[1],...unit.words.slice(0,sentenceTarget-1).map(word=>wordExamples(word,unit)[0])];
      if(state.sentenceRound>=sentences.length){
        board.innerHTML=`<div class="game-finish"><span>🏁</span><h3>${companionName()} đã về đích!</h3><p>Em hoàn thành ${sentences.length} chặng và đạt ${state.sentenceScore} điểm xây câu.</p><button class="primary-button" id="restartSentence">Đua lại ${sentences.length} chặng</button></div>`;
        $('#restartSentence').onclick=()=>{state.sentenceRound=0;state.sentenceScore=0;renderGameZone()};
        return;
      }
      const target=sentences[state.sentenceRound].replace(/[.!?]$/g,''),tokens=shuffle(target.split(/\s+/));
      board.innerHTML=`<section class="sentence-builder" id="gameSentence" data-target="${enc(target)}"><div class="sentence-race"><span>CHẶNG ${state.sentenceRound+1}/${sentences.length}</span><div class="race-track"><span class="race-milo" style="left:${Math.max(4,state.sentenceRound/sentences.length*90)}%"><img src="${miloEvolutionImage()}" alt=""></span><i style="width:${state.sentenceRound/sentences.length*100}%"></i></div><b>🏁</b></div><div class="exercise-title"><span>🏁</span><b>Đua xây câu</b></div><p>Chạm từng thẻ theo đúng thứ tự:</p><div class="sentence-line" id="gameSentenceLine"><em>Câu của em sẽ hiện ở đây…</em></div><div class="token-bank">${tokens.map(token=>`<button data-game-token="${enc(token)}">${esc(token)}</button>`).join('')}</div><div class="button-row"><button class="primary-button" id="checkGameSentence" disabled>Kiểm tra</button><button class="secondary-button" id="resetGameSentence">Làm lại</button></div><p class="answer-note" id="gameSentenceNote"></p></section>`;
      const built=[],check=$('#checkGameSentence'),line=$('#gameSentenceLine');
      document.querySelectorAll('[data-game-token]').forEach(button=>button.onclick=()=>{built.push(decodeURIComponent(button.dataset.gameToken));button.disabled=true;line.innerHTML=built.map(word=>`<span>${esc(word)}</span>`).join('');check.disabled=[...document.querySelectorAll('[data-game-token]')].some(item=>!item.disabled)});
      check.onclick=()=>{const good=built.join(' ').toLowerCase()===target.toLowerCase(),note=$('#gameSentenceNote');note.textContent=good?'✓ Câu chính xác! Milo chạy sang chặng tiếp theo!':'Chưa đúng thứ tự, thử lại nhé.';note.className=`answer-note ${good?'good':'bad'}`;setMilo(good?'Perfect! Em đã thắng chặng xây câu.':'Thứ tự chưa đúng, em thử lại nhé.');if(good){check.disabled=true;state.sentenceScore+=20;recordDaily('gameCorrect');speak(target);setTimeout(()=>{state.sentenceRound++;renderGameZone()},900)}};
      $('#resetGameSentence').onclick=renderGameBoard;
    }
  }
  function renderGameZone(){
    const board=$('#gameZone');
    if(!board)return;
    const huntRounds=gradeGames[state.grade].hunt;
    const matchPairs=Math.min(gradeGames[state.grade].match,currentUnit().words.length),sentenceRounds=Math.min(gradeGames[state.grade].sentence,currentUnit().words.length);
    board.innerHTML=`<section class="game-zone"><div class="game-scene"><img src="enhanced-market-scene.webp" alt="Milo và các bạn nhỏ trong khu chợ học tiếng Anh"><span class="game-balloon balloon-a">🎈</span><span class="game-balloon balloon-b">⭐</span><span class="game-butterfly">🦋</span><div><span class="card-label">MILO GAME ZONE</span><h2>Chơi để nhớ lâu hơn</h2><p>Mỗi trò chơi là một hành trình nhiều vòng, có chuyển động, âm thanh, điểm thưởng và phản hồi ngay. Mỗi câu đúng +3 🌟 để nuôi Milo.</p><span class="game-score">🔎 ${state.gameScore} · 🧩 ${state.matchDone.length} · 🏁 ${state.sentenceScore} điểm</span></div></div><div class="game-mode-picker"><button class="${state.gameMode==='hunt'?'active':''}" data-game-mode="hunt"><span>🔎</span><b>Săn từ bằng tranh</b><small>${huntRounds} vòng chuyển động</small></button><button class="${state.gameMode==='match'?'active':''}" data-game-mode="match"><span>🃏</span><b>Lật thẻ nối cặp</b><small>${matchPairs} cặp · ${Math.ceil(matchPairs/6)} bản đồ</small></button><button class="${state.gameMode==='sentence'?'active':''}" data-game-mode="sentence"><span>🏁</span><b>Đua xây câu</b><small>${sentenceRounds} chặng đua</small></button></div><div id="gameBoard"></div></section>`;
    document.querySelectorAll('[data-game-mode]').forEach(button=>button.onclick=()=>{state.gameMode=button.dataset.gameMode;if(state.gameMode==='match'&&!state.matchCards.length)state.matchCards=[];renderGameZone()});
    renderGameBoard();
  }
  function explainPattern(question){
    const text=question.toLowerCase();
    if(text.startsWith('how many'))return'Dùng “How many ...?” để hỏi số lượng. Câu trả lời gồm số và tên đồ vật.';
    if(text.startsWith('how old'))return'Dùng “How old ...?” để hỏi tuổi. Trả lời bằng số tuổi và “years old”.';
    if(text.startsWith('how often'))return'Dùng “How often ...?” để hỏi mức độ thường xuyên. Trả lời với always, usually, often hoặc sometimes.';
    if(text.startsWith('how do'))return'Dùng “How do ...?” để hỏi cách thức hoặc phương tiện. Câu trả lời nêu cách em thực hiện.';
    if(text.startsWith('what time'))return'Dùng “What time ...?” để hỏi giờ. Trả lời với “at + giờ”.';
    if(text.startsWith('what did')||text.startsWith('where did'))return'Đây là câu hỏi về việc đã xảy ra. Khi trả lời, dùng động từ ở dạng quá khứ.';
    if(text.startsWith('where'))return'Dùng “Where ...?” để hỏi nơi chốn hoặc vị trí. Trả lời bằng địa điểm và giới từ phù hợp.';
    if(text.startsWith('who'))return'Dùng “Who ...?” để hỏi về một người. Câu trả lời giới thiệu người đó.';
    if(text.startsWith('can'))return'Dùng “Can ...?” để hỏi khả năng. Trả lời “Yes, ... can” hoặc “No, ... cannot”.';
    if(text.startsWith('do ')||text.startsWith('does '))return'Dùng “Do/Does ...?” để hỏi sở thích hoặc thói quen. Trả lời Yes/No rồi bổ sung thông tin.';
    if(text.startsWith('would'))return'Dùng “Would ...?” để hỏi mong muốn hoặc đưa ra lời mời lịch sự.';
    return'Học cả cụm câu hỏi và câu trả lời. Sau đó thay thông tin để nói về chính em.';
  }
  function phonicsTargets(text){
    const targets=[];
    let stressMode=false;
    String(text||'').split('·').map(part=>part.trim()).filter(Boolean).forEach(part=>{
      const sound=part.match(/\/([^/]+)\/\s+trong\s+(.+)$/i);
      if(sound){
        targets.push({kind:'sound',symbol:`/${sound[1].trim()}/`,word:sound[2].trim()});
        stressMode=false;
        return;
      }
      const stress=part.match(/trọng âm\s+(.+)$/i);
      if(stress){
        targets.push({kind:'stress',symbol:'NHẤN',word:stress[1].trim()});
        stressMode=true;
        return;
      }
      if(stressMode&&!/^(?:âm|cụm)\b/i.test(part)){
        targets.push({kind:'stress',symbol:'NHẤN',word:part});
      }
    });
    if(targets.length)return targets.slice(0,3);
    const fallback=[...String(text||'').matchAll(/\/([^/]+)\//g)].map(match=>({kind:'sound',symbol:`/${match[1]}/`,word:'từ mẫu'}));
    return fallback.length?fallback:[{kind:'sound',symbol:'ÂM',word:'từ mẫu'}];
  }
  function soundTechnique(symbol,word){
    const key=String(symbol).replaceAll('/','').trim();
    const base={
      m:['Khép hai môi nhẹ, không mím quá chặt.','Lưỡi thả lỏng, nằm tự nhiên trong miệng.','Rung cổ; hơi đi qua mũi và được giữ đều.','Không thêm “ờ” sau âm /m/.',`m… → ${word}`],
      s:['Môi hơi mở và kéo nhẹ sang hai bên.','Đầu lưỡi ở sát sau răng trên nhưng không chạm răng.','Đẩy một luồng hơi mảnh, liên tục; cổ không rung.','Không đọc thành /x/ và không thêm “ờ”.',`s… → ${word}`],
      k:['Môi mở tự nhiên.','Phần sau lưỡi chạm ngạc mềm rồi bật ra nhanh.','Chặn hơi rất ngắn rồi thả mạnh; cổ không rung.','Không kéo dài /k/ hoặc đọc thành “cờ”.',`k → ${word}`],
      w:['Chu môi tròn như chuẩn bị huýt sáo rồi mở nhanh.','Lưỡi lùi nhẹ, không chạm răng.','Hơi và giọng đi liền, âm rất ngắn.','Không đọc thành “quờ” hoặc /v/.',`w → ${word}`],
      b:['Khép hai môi rồi bật mở nhanh.','Lưỡi thả lỏng.','Giữ hơi sau môi; bật ra cùng tiếng rung ở cổ.','Không đọc thành “bờ”.',`b → ${word}`],
      d:['Môi mở tự nhiên.','Đầu lưỡi chạm lợi trên, ngay sau răng.','Bật lưỡi xuống nhanh; cổ có rung.','Không thêm nguyên âm sau /d/.',`d → ${word}`],
      f:['Răng trên chạm rất nhẹ vào môi dưới.','Lưỡi thả lỏng.','Thổi hơi liên tục qua khe răng–môi; cổ không rung.','Không cắn môi và không đọc thành /phờ/.',`f… → ${word}`],
      p:['Khép hai môi rồi bật mở.','Lưỡi thả lỏng.','Bật một luồng hơi rõ; cổ không rung.','Đặt tay trước miệng để kiểm tra hơi bật.',`p → ${word}`],
      t:['Môi mở tự nhiên.','Đầu lưỡi chạm lợi trên rồi hạ nhanh.','Hơi bật nhẹ; cổ không rung.','Không đọc thành “tờ”.',`t → ${word}`],
      h:['Miệng mở theo nguyên âm đứng sau.','Lưỡi thả lỏng và không chặn hơi.','Thở hơi nhẹ từ cổ ra ngoài; không rung mạnh.','Không bật âm quá nặng.',`h… → ${word}`],
      r:['Môi hơi tròn.','Đầu lưỡi cong nhẹ lên nhưng không chạm vòm miệng.','Giọng rung đều; hơi đi giữa miệng.','Không rung đầu lưỡi như âm “r” tiếng Việt.',`r… → ${word}`],
      n:['Môi mở tự nhiên.','Đầu lưỡi chạm lợi trên.','Cổ rung; hơi thoát qua mũi.','Không thêm “ờ” sau /n/.',`n… → ${word}`],
      v:['Răng trên chạm nhẹ môi dưới.','Lưỡi thả lỏng.','Thổi hơi đồng thời làm cổ rung.','Phân biệt /v/ có rung với /f/ không rung.',`v… → ${word}`],
      j:['Môi mở hẹp.','Giữa lưỡi nâng gần vòm miệng, không chạm.','Giọng đi ra nhanh và liền với nguyên âm sau.','Không đọc thành “giờ”.',`j → ${word}`],
      'ʃ':['Môi hơi tròn và đưa ra trước.','Lưỡi nâng gần vòm miệng, đầu lưỡi không chạm răng.','Hơi đi liên tục; cổ không rung.','Giữ âm mềm như tiếng “suỵt”.',`ʃ… → ${word}`],
      'tʃ':['Môi hơi tròn.','Đầu lưỡi chặn ở lợi trên rồi bật sang vị trí /ʃ/.','Chặn hơi rồi thả nhanh; cổ không rung.','Không tách thành “tờ–chờ”.',`t → ʃ → tʃ → ${word}`],
      'dʒ':['Môi hơi tròn.','Lưỡi chặn ở lợi trên rồi trượt sang âm xát.','Thả hơi nhanh và giữ cổ rung.','Không đọc thành hai âm rời.',`d → ʒ → dʒ → ${word}`]
    };
    const clusters={
      br:['Khép môi để chuẩn bị /b/, sau đó hơi tròn môi cho /r/.','Bật /b/ rồi kéo lưỡi lùi và cong nhẹ ngay, không chạm vòm.','Cả hai âm có giọng; chuyển âm liền trong một nhịp.','Không đọc “bờ-rờ” và không chen âm “ơ”.',`b → r → br → ${word}`],
      tr:['Môi mở, hơi tròn nhẹ khi sang /r/.','Đầu lưỡi chạm lợi cho /t/, hạ xuống rồi cong nhẹ cho /r/.','Bật hơi ở /t/ rồi nối ngay sang /r/.','Không đọc thành “chờ” hoặc “tờ-rờ”.',`t → r → tr → ${word}`],
      st:['Môi mở hẹp.','Giữ lưỡi gần răng cho /s/, rồi chạm lợi nhanh cho /t/.','Kéo /s/ ngắn và chặn hơi ở /t/.','Không chen “ơ” giữa /s/ và /t/.',`s → t → st → ${word}`],
      gr:['Môi mở rồi hơi tròn khi sang /r/.','Sau lưỡi bật /g/, sau đó đầu lưỡi cong nhẹ cho /r/.','Cổ rung liên tục; hai âm dính liền nhau.','Không đọc “gờ-rờ”.',`g → r → gr → ${word}`],
      sn:['Môi mở hẹp.','Giữ /s/ gần răng rồi đưa đầu lưỡi chạm lợi cho /n/.','/s/ không rung, /n/ rung và hơi qua mũi.','Không thêm nguyên âm giữa hai âm.',`s → n → sn → ${word}`],
      fl:['Răng trên chạm môi dưới cho /f/, sau đó đầu lưỡi chạm lợi cho /l/.','Chuyển lưỡi nhanh sang /l/ ngay khi kết thúc /f/.','Hơi /f/ liên tục rồi bật giọng ở /l/.','Không đọc “phờ-lờ”.',`f → l → fl → ${word}`],
      pr:['Khép môi bật hơi /p/, sau đó hơi tròn môi.','Bật /p/ rồi cong lưỡi nhẹ cho /r/.','/p/ bật hơi, /r/ có giọng; nối trong một nhịp.','Không chen âm “ơ”.',`p → r → pr → ${word}`],
      pl:['Khép môi bật /p/.','Ngay sau đó đưa đầu lưỡi chạm lợi trên cho /l/.','Bật hơi ở /p/, chuyển nhanh sang /l/.','Không đọc “pờ-lờ”.',`p → l → pl → ${word}`],
      dr:['Môi mở rồi hơi tròn.','Bật đầu lưỡi khỏi lợi cho /d/, sau đó cong nhẹ cho /r/.','Cổ rung suốt cụm âm.','Không tách thành “đờ-rờ”.',`d → r → dr → ${word}`],
      sp:['Môi mở hẹp rồi khép nhanh.','Giữ /s/ gần răng, sau đó khép môi cho /p/.','Kéo /s/ ngắn; /p/ bật hơi nhẹ.','Không thêm “ờ” giữa hai âm.',`s → p → sp → ${word}`],
      gl:['Môi mở.','Sau lưỡi bật /g/, đầu lưỡi chuyển lên lợi cho /l/.','Cổ rung; hai âm nối liền.',`Không đọc “gờ-lờ”.`,`g → l → gl → ${word}`],
      str:['Môi mở hẹp rồi hơi tròn ở /r/.','Đi từ vị trí /s/ gần răng → chạm lợi /t/ → cong nhẹ /r/.','Một luồng hơi duy nhất, không ngắt giữa ba âm.','Không chen “ơ”: tránh “sờ-tờ-rờ”.',`s → t → r → str → ${word}`],
      fr:['Răng trên chạm môi dưới rồi môi hơi tròn.','Giữ lưỡi thả ở /f/, sau đó cong nhẹ cho /r/.','Thổi /f/ rồi bật giọng ngay ở /r/.','Không đọc “phờ-rờ”.',`f → r → fr → ${word}`]
    };
    const selected=clusters[key]||base[key]||['Môi mở tự nhiên theo nguyên âm đi sau.','Đặt lưỡi theo âm mẫu và giữ hàm thả lỏng.','Nghe để phân biệt âm có rung hay chỉ có hơi.','Không đọc tên chữ cái hoặc thêm âm “ơ”.',`${symbol} → ${word}`];
    return{mouth:selected[0],tongue:selected[1],air:selected[2],avoid:selected[3],drill:selected[4]};
  }
  function stressTechnique(word){
    const marks={
      carbohydrates:'car-bo-HY-drates',architect:'AR-chi-tect',expensive:'ex-PEN-sive',musician:'mu-SI-cian',scientist:'SCI-en-tist',
      extreme:'ex-TREME',entertainment:'en-ter-TAIN-ment',performance:'per-FOR-mance',adventure:'ad-VEN-ture',charity:'CHA-ri-ty',
      volunteer:'vo-lun-TEER',invention:'in-VEN-tion',mechanical:'me-CHA-ni-cal',electronic:'e-lec-TRO-nic',civilization:'ci-vi-li-ZA-tion',
      archaeologist:'ar-chae-OL-o-gist',immigrant:'IM-mi-grant',environmental:'en-vi-ron-MEN-tal',emergency:'e-MER-gen-cy',paramedic:'pa-ra-MED-ic',
      biodiversity:'bi-o-di-VER-si-ty',captivity:'cap-TI-vi-ty',literature:'LI-te-ra-ture',metaphor:'ME-ta-phor',communicate:'com-MU-ni-cate',
      'non-verbal':'NON-ver-bal',triathlon:'tri-ATH-lon',energizing:'EN-er-gi-zing',hurricane:'HUR-ri-cane',temperature:'TEM-pe-ra-ture',
      memorize:'ME-mo-rize',repetition:'re-pe-TI-tion',confident:'CON-fi-dent'
    };
    const drill=marks[String(word).toLowerCase()]||`Nghe → tìm âm tiết nổi bật → nói cả từ: ${word}`;
    return{
      mouth:'Mở miệng rõ hơn ở âm tiết được nhấn; các âm tiết còn lại nói gọn.',
      tongue:'Đặt lưỡi chính xác cho nguyên âm của âm tiết nhấn, không nuốt âm.',
      air:'Âm tiết nhấn dài hơn, rõ hơn và cao hơn một chút.',
      avoid:'Không nhấn đều mọi âm tiết và không đọc từng chữ rời rạc.',
      drill
    };
  }
  function phonicsGuide(unit,words){
    const targets=phonicsTargets(unit.phonics);
    const cards=targets.map((target,index)=>{
      const guide=target.kind==='stress'?stressTechnique(target.word):soundTechnique(target.symbol,target.word);
      return`<article class="articulation-card ${target.kind==='stress'?'stress-card':''}">
        <div class="articulation-card-head"><span>${esc(target.symbol)}</span><div><small>${target.kind==='stress'?`TỪ NHẤN ${index+1}`:`ÂM ${index+1}`}</small><b>${esc(target.word)}</b></div><button data-say="${enc(target.word)}" data-rate=".58" aria-label="Nghe ${esc(target.word)}">🔊</button></div>
        <div class="articulation-checklist"><p><b>👄 Môi</b><span>${esc(guide.mouth)}</span></p><p><b>👅 Lưỡi</b><span>${esc(guide.tongue)}</span></p><p><b>💨 Hơi/giọng</b><span>${esc(guide.air)}</span></p><p><b>⚠️ Tránh</b><span>${esc(guide.avoid)}</span></p></div>
        <div class="sound-drill"><small>GHÉP CHẬM TỪNG NẤC</small><strong>${esc(guide.drill)}</strong></div>
      </article>`;
    }).join('');
    return`<section class="sound-focus sound-focus-v603">
      <div class="sound-visual-v603"><small>${targets.some(target=>target.kind==='stress')?'TRỌNG ÂM CẦN NHỚ':'ÂM CẦN NHỚ'}</small><div class="sound-token-list">${targets.map(target=>`<span class="sound-token ${target.kind==='stress'?'stress':''}">${esc(target.symbol)}</span>`).join('')}</div><div class="sound-example-list">${targets.map(target=>`<span>${esc(target.word)}</span>`).join('')}</div></div>
      <div class="sound-focus-copy-v603"><span class="card-label">TRỌNG TÂM PHÁT ÂM</span><h2>${esc(unit.phonics)}</h2><p>Không đọc tên chữ cái. Con quan sát vị trí môi và lưỡi, nghe mẫu chậm, ghép âm rồi mới nói cả từ.</p><div class="sound-goal-v603"><span>👀 Nhìn đúng khẩu hình</span><span>👂 Nghe âm có rung hay có hơi</span><span>🎤 Nói liền, không thêm “ơ”</span></div><div class="button-row"><button class="primary-button" data-say="${enc(targets.map(target=>target.word).join('. '))}" data-rate=".52">🔊 Nghe từng từ thật chậm</button><button class="secondary-button" data-say="${enc(unit.pattern.join(' '))}" data-rate=".72">🎵 Nghe cả câu</button></div></div>
    </section>
    <section class="articulation-guide"><div class="articulation-guide-head"><span>👄</span><div><small>KHẨU HÌNH VÀ LUỒNG HƠI</small><h2>Đặt miệng đúng trước khi nói</h2></div></div><div class="articulation-grid">${cards}</div></section>
    <section class="guided-practice-v603"><h3>Con luyện theo 5 bước này</h3><p>Mỗi bước làm 2–3 lần. Chỉ sang bước tiếp theo khi âm trước đã rõ.</p><div class="guided-step-row"><article><span>1</span><b>Chỉ nghe</b><small>Nhắm mắt, nghe từ mẫu hai lần và nhận ra âm nổi bật.</small></article><article><span>2</span><b>Đặt miệng</b><small>Nhìn hướng dẫn môi–lưỡi, chưa cần nói nhanh.</small></article><article><span>3</span><b>Ghép âm</b><small>Nói từng nấc trong ô “Ghép chậm”, không chen âm “ơ”.</small></article><article><span>4</span><b>Nói từng từ</b><small>Chạm từng thẻ bên dưới, nghe rồi lặp lại ba lần.</small></article><article><span>5</span><b>Nói cả câu</b><small>${esc(unit.pattern[1])}</small></article></div><div class="sound-word-row phonics-word-bank-v603">${words.map(word=>`<button data-say="${enc(word[0])}" data-rate=".58"><strong>${word[2]}</strong><b>${esc(word[0])}</b><span>🔊</span></button>`).join('')}</div><div class="button-row centered"><button class="primary-button phonics-check-v603" type="button" data-open-pronunciation data-pronunciation-target="${esc(unit.pattern[1])}">🎯 Thu giọng và để Milo chỉ đúng chỗ sai</button></div></section>`;
  }
  function targetRange(text,fallback){
    const numbers=(text.match(/\d+/g)||[]).map(Number);
    return numbers.length>=2?[numbers[0],numbers[1]]:fallback;
  }
  function readingPassage(unit,grade){
    if(window.MILO_EXPERT_PROGRAM)return window.MILO_EXPERT_PROGRAM.readingPassage(unit,state.grade);
    const minimum=targetRange(currentProfile().reading,state.grade===2?[15,30]:[35,60])[0];
    const parts=[unit.sample];
    const more=[
      `This lesson is about ${unit.title.toLowerCase()}.`,
      `${unit.pattern[0]} ${unit.pattern[1]}`,
      `We use the words ${unit.words.map(word=>word[0]).join(', ')} in this topic.`,
      'The children listen carefully, take turns and answer in a complete sentence.',
      'They ask a friend one question and share one true idea about their own life.',
      'Learning these words helps them speak clearly in a familiar situation at school or at home.',
      'First, they look at the pictures and predict what the text will say.',
      'Next, they underline useful details and connect each detail to the main idea.',
      'Milo asks them to explain an answer instead of choosing it without evidence.',
      'The children compare two ideas and notice what is similar or different.',
      'They use the new language to solve a small real-life problem together.',
      'Finally, each child summarises the lesson and gives one reason for an opinion.',
      'This careful process builds confidence, independence and stronger communication skills.'
    ];
    let index=0;
    while(parts.join(' ').trim().split(/\s+/).length<minimum&&index<more.length)parts.push(more[index++]);
    return parts.join(' ');
  }
  function heading(kicker,icon,title,lead){
    return`<div class="content-heading"><span class="content-number">${icon}</span><div><span class="lesson-kicker">${kicker}</span><h1>${esc(title)}</h1><p>${esc(lead)}</p></div></div>`;
  }
  function choice(question,options,correct){
    return`<section class="exercise-card" data-correct="${enc(correct)}"><div class="exercise-title"><span>🧩</span><b>Luyện ngay</b></div><div class="exercise-question">${question}</div><div class="answer-grid">${options.map(option=>`<button class="answer" data-choice="${enc(option)}">${esc(option)}</button>`).join('')}</div><p class="answer-note"></p></section>`;
  }
  function currentSourceSection(){
    return sourceUnitSpec()?.sections?.find(section=>section.id===state.part)||null;
  }
  function sourceStatusText(section){
    if(section.contentOrigin==='milo_practice')return'Luyện thêm do Milo biên soạn';
    if(section.exactVerification?.coverage==='complete_visible_section')return'Đã đọc và đối chiếu trực tiếp từng chữ từ ảnh';
    if(section.exactVerification?.coverage==='visible_text_only')return'Chữ nhìn thấy đã đối chiếu · audio/video vẫn chờ nguồn';
    if(section.verificationStatus==='verified_from_image')return'Đã xác minh từ ảnh';
    if(section.verificationStatus==='needs_review')return'Cần kiểm tra thủ công';
    if(section.verificationStatus==='ocr_extracted_needs_review')return'Đã trích xuất OCR · cần đối chiếu thủ công';
    if(section.verificationStatus==='mapped_from_manifest')return'Đã ánh xạ từ manifest';
    return'Đã ánh xạ nguồn';
  }
  function sourceTracePanel(section){
    const zips=(section.sourceZip||[]).join(' · ')||'Không có ZIP nguồn — nội dung Milo';
    const images=section.sourceImage||[];
    const assets=section.sourceAsset||[];
    return`<details class="source-trace-panel">
      <summary><span>🔎</span><div><b>Nguồn đối chiếu</b><small>${esc(sourceStatusText(section))}</small></div><em>${section.contentOrigin==='book_source'?'BOOK SOURCE':'MILO PRACTICE'}</em></summary>
      <div class="source-trace-meta">
        <article><small>LỚP / UNIT</small><b>Lớp ${section.grade} · Unit ${section.unit}</b></article>
        <article><small>ZIP NGUỒN</small><b>${esc(zips)}</b></article>
        <article><small>TRANG SÁCH</small><b>${esc(section.sourcePage||'Không áp dụng')}</b></article>
        <article><small>LOẠI PHẦN</small><b>${esc(section.sectionType)}</b></article>
        <article><small>TRẠNG THÁI</small><b>${esc(sourceStatusText(section))}</b></article>
        <article><small>NGUỒN NỘI DUNG</small><b>${section.contentOrigin==='book_source'?'Nội dung sách hoặc ứng viên đang chờ xác minh':'Luyện thêm do Milo biên soạn'}</b></article>
      </div>
      ${images.length?`<div class="source-trace-images">${assets.slice(0,4).map((asset,index)=>`<button type="button" data-source-asset="${esc(asset)}" title="Mở đúng ảnh trong Sách nguồn"><img src="${esc(asset)}" alt="${esc(images[index]||'Ảnh nguồn')}"><span>${esc(images[index]||'Ảnh nguồn')}</span></button>`).join('')}</div><p class="source-trace-more">${images.length>4?`Còn ${images.length-4} ảnh liên quan trong mục Sách nguồn.`:'Bấm ảnh để phóng to và đối chiếu toàn trang.'}</p>`:''}
      <div class="source-review-link"><small>🔐 Phụ huynh xem đối chiếu nguồn trong khu Quản trị của Milo. OCR thô không xuất hiện ở giao diện học sinh.</small></div>
    </details>`;
  }
  function sectionVerified(section){return section?.verificationStatus==='verified_from_image'}
  function studentSourceGate(section,label='Nội dung sách'){
    if(sectionVerified(section))return`<section class="verified-source-note"><span>✓</span><div><b>${esc(label)} đã được đọc và đối chiếu trực tiếp từ ảnh</b><p>Phần “Nguyên văn đã đối chiếu” giữ nguyên chữ và dấu câu nhìn thấy trên trang sách. Bản dịch, IPA, ví dụ và hướng dẫn mang nhãn Milo là phần hỗ trợ học, không được coi là nguyên văn sách.</p></div></section>`;
    if(section?.exactVerification?.coverage==='visible_text_only')return`<section class="source-review-pending partial"><span>◐</span><div><b>${esc(label)}: chữ in trên trang đã được đối chiếu</b><p>Audio hoặc video gốc không có trong ảnh nên Milo không tự đoán lời thoại. Phần chữ nhìn thấy vẫn được hiển thị riêng trong “Nguyên văn đã đối chiếu”.</p></div></section>`;
    return`<section class="source-review-pending"><span>🛡️</span><div><b>${esc(label)} đang chờ chép và đối chiếu từng chữ</b><p>Học sinh đọc nguyên văn trực tiếp trên ảnh sách ở bên dưới. OCR thô, tiêu đề đoán và câu chưa xác minh không được dùng làm nội dung sách. Hoạt động bổ trợ luôn mang nhãn <strong>Luyện thêm do Milo biên soạn</strong>.</p></div></section>`;
  }
  function exactSourcePages(section){
    const images=section?.sourceImage||[];
    const assets=section?.sourceAsset||[];
    if(!assets.length)return'';
    const exact=sectionVerified(section);
    return`<section class="exact-source-pages ${exact?'verified':'pending'}">
      <header><div><small>${exact?'ĐÃ ĐỐI CHIẾU':'NGUYÊN VĂN TRÊN ẢNH SÁCH'}</small><h2>${exact?'Ảnh đã dùng để xác minh nội dung':'Đọc trực tiếp ảnh nguồn — không qua OCR'}</h2></div><span>${assets.length} ảnh</span></header>
      <p>${exact?'Các dữ liệu cấu trúc bên dưới đã được kiểm tra trên những ảnh này.':'Đây là bản chữ chính xác nhất hiện có trong app. Bấm từng ảnh để mở đúng trang, phóng to và đọc rõ từng dòng.'}</p>
      <div class="exact-source-page-strip">${assets.map((asset,index)=>`<button type="button" data-source-asset="${esc(asset)}" aria-label="Mở ${esc(images[index]||`ảnh ${index+1}`)}"><img src="${esc(asset)}" loading="lazy" alt="${esc(images[index]||`Ảnh nguồn ${index+1}`)}"><span>${esc(images[index]||`Ảnh ${index+1}`)} · Phóng to</span></button>`).join('')}</div>
    </section>`;
  }
  function exactBookTranscription(section){
    const record=section?.exactVerification;
    const transcription=record?.content?.exactTranscription;
    if(!transcription)return'';
    const complete=record.coverage==='complete_visible_section';
    const blocks=transcription.blocks||[];
    return`<section class="exact-book-transcription ${complete?'complete':'partial'}">
      <header><div><small>${complete?'ĐÃ ĐỌC TRỰC TIẾP TỪ ẢNH':'ĐÃ ĐỐI CHIẾU PHẦN CHỮ NHÌN THẤY'}</small><h2>Nguyên văn đã đối chiếu · ${esc(transcription.title||section.title)}</h2></div><span>Trang ${esc(record.printedPages||section.sourcePage||'nguồn')}</span></header>
      <p class="exact-book-policy">${complete?'Từng dòng dưới đây đã được kiểm tra trực tiếp trên ảnh nguồn liệt kê trong hồ sơ đối chiếu.':'Chỉ phần chữ in nhìn thấy được xác minh. App không suy đoán nội dung audio hoặc video không có trong ảnh.'}</p>
      <div class="exact-book-blocks">${blocks.map(block=>`<article><h3>${esc(block.heading||'')}</h3>${(block.lines||[]).map(line=>`<p>${esc(line)}</p>`).join('')}</article>`).join('')}</div>
    </section>`;
  }
  function lessonFlowStrip(){
    return`<nav class="guided-lesson-flow" aria-label="Quy trình học"><span class="active">1<b>Milo giảng</b></span><span>2<b>Xem ví dụ</b></span><span>3<b>Nghe</b></span><span>4<b>Luyện</b></span><span>5<b>Làm bài</b></span><span>6<b>Kiểm tra</b></span><span>7<b>Hoàn thành</b></span></nav>`;
  }
  function teacherMode(objective,quick,deep){
    return`<section class="milo-teacher-studio"><header><div><small>MILO GIẢNG BÀI</small><h2>${esc(objective)}</h2></div><div class="teacher-mode-tabs"><button type="button" class="active" data-teacher-mode="quick">Giảng nhanh</button><button type="button" data-teacher-mode="deep">Giảng kỹ</button></div></header><div class="teacher-mode-copy active" data-teacher-copy="quick"><span>⚡</span><p>${esc(quick)}</p></div><div class="teacher-mode-copy" data-teacher-copy="deep"><span>🧠</span><p>${esc(deep)}</p></div><button type="button" class="teacher-repeat" data-say="${enc(quick)}">🔊 Milo giảng lại</button></section>`;
  }
  function bilingualExample(en,vi,note=''){
    if(!en)return'';
    return`<article class="bilingual-example"><div><small>ENGLISH</small><b>${esc(en)}</b><button type="button" data-say="${enc(en)}">🔊</button></div><p><strong>Tiếng Việt:</strong> ${esc(vi||'Câu ví dụ minh họa đúng phạm vi kiến thức của Unit.')}</p>${note?`<em>${esc(note)}</em>`:''}</article>`;
  }
  function lessonExamples(items=[]){return items.filter(Boolean).length?`<section class="lesson-examples"><div class="lesson-section-title"><span>💡</span><div><small>BƯỚC 2</small><h2>Xem ví dụ song ngữ</h2></div></div>${items.filter(Boolean).join('')}</section>`:''}
  function pronunciationMeta(term){
    const lex=window.MILO_PRONUNCIATION_LEXICON;
    const entries=lex?.lookup?.(term)||[];
    const ipa=entries.filter(item=>item.ipa).map(item=>item.ipa).join(' · ');
    const stresses=lex?.primaryStress?.(term)||[];
    const stress=stresses.filter(item=>item.pattern?.includes('1')).map(item=>`${item.word}: âm ${item.syllable}`).join(' · ');
    const phones=entries.map(item=>item.phones||'').join(' ');
    const tips=[];
    if(/\bTH\b/.test(phones))tips.push('đặt đầu lưỡi nhẹ giữa hai răng');
    if(/\bDH\b/.test(phones))tips.push('giống TH nhưng có rung cổ');
    if(/\bR\b/.test(phones))tips.push('R tiếng Anh không rung đầu lưỡi');
    if(/\bL\b/.test(phones))tips.push('đầu lưỡi chạm lợi trên');
    if(/\bV\b/.test(phones))tips.push('răng trên chạm môi dưới');
    if(/\bW\b/.test(phones))tips.push('chu môi rồi mở nhanh');
    if(/\bSH\b/.test(phones))tips.push('môi hơi tròn, hơi đi giữa lưỡi');
    if(/\bCH\b/.test(phones))tips.push('bật âm ngắn, không thêm “ơ”');
    if(/\b(P|T|K|S|Z|D|G)\b\s*$/.test(phones.trim()))tips.push('giữ rõ âm cuối, không thêm “ơ”');
    return{ipa:ipa||'Chưa có IPA trong từ điển cục bộ',stress:stress||'Nghe mẫu để nhận trọng âm',tip:tips.slice(0,2).join(' · ')||'Nghe chậm và bắt chước, không đọc theo chữ Việt'};
  }
  function inferPartOfSpeech(term,meaning=''){
    const t=String(term||'').toLowerCase(),m=String(meaning||'').toLowerCase();
    if(/^(to\s+)/.test(t)||/^(đi|chạy|nhảy|ăn|uống|đọc|viết|nghe|nói|làm|học|chơi|băng qua|rẽ|mặc|đeo|cầm)/.test(m))return'động từ / cụm động từ';
    if(/^(ở|bên|gần|trên|dưới|dọc theo|xung quanh|vào|ra)/.test(m))return'giới từ / trạng từ';
    if(/^(mệt|chán|lo|khó|dễ|thú vị|bận|quan trọng|cao|thấp|lớn|nhỏ|đẹp|xấu|nhanh|chậm)/.test(m)||/(ous|ful|less|ive|able|ible|ed)$/.test(t))return'tính từ';
    return'danh từ / cụm từ';
  }
  function exampleVietnamese(item){
    return`Câu dùng “${item.term}” với nghĩa “${item.meaning||'đang học'}” trong ngữ cảnh của Unit.`;
  }
  function dynamicVocabularyCards(items=[]){
    return`<div class="dynamic-vocab-grid vocab-pro-grid">${items.map(item=>{const meta=pronunciationMeta(item.term);return`<article class="vocab-pro-card"><span class="vocab-icon">${item.icon||'🔤'}</span><div class="vocab-main"><div class="vocab-word-line"><b>${esc(item.term)}</b><em>${esc(inferPartOfSpeech(item.term,item.meaning))}</em></div><small><strong>Milo giải nghĩa:</strong> ${esc(item.meaning||'')}</small><div class="vocab-phonics"><code>${esc(meta.ipa)}</code><span>Trọng âm: ${esc(meta.stress)} · Milo hỗ trợ</span><span>Mẹo Milo: ${esc(meta.tip)}</span></div><p><strong>Ví dụ luyện thêm do Milo:</strong> ${esc(item.example||'')}</p><p class="vocab-vi"><strong>Giải thích của Milo:</strong> ${esc(exampleVietnamese(item))}</p><div class="vocab-actions"><button type="button" data-say="${enc(item.term)}" aria-label="Nghe ${esc(item.term)}">🔊 Nghe</button><button type="button" data-say="${enc(item.term)}" data-rate=".58">🐢 Chậm</button><button type="button" data-open-pronunciation data-pronunciation-target="${esc(item.term)}">🎤 Con luyện nói</button></div></div></article>`}).join('')}</div>`;
  }
  function practiceHeader(title='Luyện tập cùng Milo'){
    return`<div class="lesson-section-title"><span>🧩</span><div><small>LUYỆN THÊM DO MILO BIÊN SOẠN</small><h2>${esc(title)}</h2></div></div>`;
  }
  function quickCheckHeader(){return`<div class="lesson-section-title"><span>✅</span><div><small>KIỂM TRA NHANH</small><h2>Kiểm tra đúng kiến thức vừa học</h2></div></div>`}
  function safeReadingPractice(unit,type,content,otherUnits){
    const passage=readingPassage(unit,currentGrade());
    const short=passage.split(/(?<=[.!?])\s+/).slice(0,4).join(' ');
    const title=content.title||type;
    const verified=sectionVerified(currentSourceSection());
    return`${studentSourceGate(currentSourceSection(),`${type} · ${title}`)}<section class="dynamic-reading-head"><span>${esc(type)}</span><h2>${esc(title)}</h2>${content.verifiedSummary?`<p><b>Tóm tắt đã lưu:</b> ${esc(content.verifiedSummary)}</p>`:''}<p class="${verified?'verified-copy':'pending-copy'}">${verified?'Toàn văn đã đọc trực tiếp nằm trong khung “Nguyên văn đã đối chiếu” phía trên.':'Toàn văn sách chưa hiển thị cho đến khi được đối chiếu thủ công.'}</p></section><section class="milo-practice-panel"><span class="origin-pill">MILO PRACTICE</span><h3>Bài đọc luyện tập theo đúng từ và mẫu câu của Unit</h3><p class="practice-passage">${esc(short)}</p><div class="button-row"><button class="primary-button" data-say="${enc(short)}" data-rate=".74">🔊 Nghe bài luyện</button><button class="secondary-button" data-say="${enc(short)}" data-rate=".58">🐢 Nghe chậm</button></div></section>${lessonExamples([bilingualExample(unit.pattern?.[1]||unit.sample,`Câu mẫu gắn với chủ đề: ${unit.vi}.`,'Milo dùng câu này để luyện, không ghi là nguyên văn sách.')])}<section class="lesson-practice-zone">${practiceHeader('Đọc và tìm thông tin')}${choice('Bài luyện này thuộc chủ đề nào?',uniqueOptions(unit.title,otherUnits.map(item=>item.title)),unit.title)}${choice('Khi đọc, con nên làm gì trước?',['Xem tiêu đề và từ khóa','Đoán ngẫu nhiên','Bỏ qua câu hỏi','Dịch từng chữ'],'Xem tiêu đề và từ khóa')}</section>`;
  }
  function sectionObjective(type,content,unit){
    if(type==='Big Question')return'Trả lời câu hỏi lớn của Unit bằng một câu rõ ràng.';
    if(type.startsWith('Vocabulary'))return'Hiểu nghĩa, nghe đúng và nói được từ vựng của phần này.';
    if(type==='Pronunciation')return'Nghe, đặt khẩu hình và luyện âm trọng tâm của Unit.';
    if(type.startsWith('Grammar'))return'Hiểu cấu trúc, chọn đúng và tự tạo một câu theo Unit.';
    if(type.startsWith('Reading'))return'Đọc có mục đích, tìm từ khóa và trả lời bằng bằng chứng.';
    if(type==='Listening')return'Nghe ý chính, nghe chi tiết và giải thích lựa chọn.';
    if(type==='Speaking/Communication')return'Nghe mẫu, nói theo và thay thông tin bằng câu thật của con.';
    if(type.startsWith('Writing'))return'Lập ý, viết từng bước và tự kiểm tra trước khi nộp.';
    if(type==='Project')return'Tạo sản phẩm nhỏ và trình bày bằng kiến thức của Unit.';
    return`Hiểu và vận dụng phần ${type} của Unit.`;
  }
  function renderDynamicSourceSection(section,unit,otherUnits,words){
    const type=section.sectionType;
    const icon=sourceSectionIcons[type]||'📘';
    const verified=sectionVerified(section);
    const content=verified?(section.content||{}):{};
    const originLead=verified?'Nội dung đã được đọc trực tiếp từ ảnh, giữ nguyên chữ và dấu câu, đồng thời có thể truy vết.':section.exactVerification?'Chữ nhìn thấy đã được đọc trực tiếp; phần audio/video không có trong ảnh vẫn bị khóa và không được suy đoán.':'Ảnh nguồn đã được ánh xạ nhưng phần chữ chưa xác minh hoàn toàn; học sinh chỉ thấy nội dung an toàn và bài luyện Milo được gắn nhãn.';
    const objective=sectionObjective(type,content,unit);
    const quick=`Hôm nay con chỉ cần hoàn thành một việc: ${objective.toLowerCase()}`;
    const deep=`Milo sẽ đi theo đúng thứ tự: hiểu mục tiêu, xem ví dụ, nghe mẫu, luyện có hướng dẫn, làm bài và kiểm tra nhanh. Nội dung chưa chắc chắn từ ảnh sẽ không được hiển thị như kiến thức sách.`;
    let body=lessonFlowStrip()+exactSourcePages(section)+exactBookTranscription(section)+teacherMode(objective,quick,deep);
    if(type==='Big Question'){
      const q=content.bigQuestion||unit.title;
      body+=studentSourceGate(section,'Big Question')+`<section class="book-question-hero"><span>BIG QUESTION</span><h2>${esc(q)}</h2><p><strong>Milo dịch:</strong> ${esc(content.theme||unit.vi)}</p><div class="button-row centered"><button class="primary-button" data-say="${enc(q)}">🔊 Nghe câu hỏi</button><button class="secondary-button" data-open-pronunciation data-pronunciation-target="${esc(q)}">🎤 Nói theo</button></div></section>`+lessonExamples([bilingualExample(q,content.theme||unit.vi,'Bản dịch và giải thích do Milo hỗ trợ.'),bilingualExample(unit.pattern?.[1],`Câu trả lời mẫu Milo cho chủ đề “${unit.vi}”.`,'Con có thể thay thông tin để nói về bản thân.')])+`<section class="lesson-practice-zone">${practiceHeader('Trả lời Big Question')}${choice(`Câu nào phù hợp nhất với chủ đề “${esc(unit.vi)}”?`,uniqueOptions(unit.pattern?.[1],otherUnits.map(item=>item.pattern?.[1])),unit.pattern?.[1])}<button class="primary-button wide" data-open-journey-ai>💬 Trả lời bằng giọng nói với Milo</button></section>`;
    }else if(type==='Vocabulary 1'||type==='Vocabulary 2'){
      const items=content.items||[];const first=items[0],second=items[1]||first;
      body+=studentSourceGate(section,type)+`<section class="book-section-intro"><b>${esc(type)} · từ nguồn đã đối chiếu</b><p>Danh sách từ lấy từ ảnh sách. Nghĩa Việt, IPA, trọng âm, mẹo khẩu hình, audio và câu ví dụ là phần hỗ trợ do Milo biên soạn.</p></section>${dynamicVocabularyCards(items)}${lessonExamples(items.slice(0,2).map(item=>bilingualExample(item.example,exampleVietnamese(item),`Ví dụ luyện thêm với từ đã xác minh: ${item.term}.`)))}<section class="lesson-practice-zone">${practiceHeader('Luyện từ theo nhiều cách')}${first?choice(`“${esc(first.term)}” có nghĩa là gì?`,uniqueOptions(first.meaning,items.map(item=>item.meaning)),first.meaning):''}${second?choice(`Chọn từ đúng với nghĩa “${esc(second.meaning)}”.`,uniqueOptions(second.term,items.map(item=>item.term)),second.term):''}<div class="speak-practice-callout"><span>🎤</span><div><b>Nói lại từng từ</b><p>Bấm “Con luyện nói” trên thẻ từ để Milo chấm và chỉ âm cần sửa.</p></div></div></section>`;
    }else if(type==='Vocabulary in Reading'){
      const groups=content.groups||[];
      body+=studentSourceGate(section,type)+`<section class="book-section-intro"><b>Từ vựng hỗ trợ bài đọc</b><p>Từ nguồn chưa được coi là toàn văn bài đọc. Milo chỉ luyện danh sách từ đã được gắn với Unit.</p></section><div class="reading-vocab-groups">${groups.map(group=>`<article><h3>${esc(group.label)}</h3><div>${(group.terms||[]).map(term=>`<button data-say="${enc(term)}">🔊 ${esc(term)}</button><button data-open-pronunciation data-pronunciation-target="${esc(term)}">🎤</button>`).join('')}</div></article>`).join('')}</div>`;
    }else if(type==='Pronunciation'){
      const focus=verified?content.focus:'';
      body+=studentSourceGate(section,'Trọng tâm Pronunciation')+`<section class="pronunciation-focus-safe"><span>${verified?'ÂM TRỌNG TÂM':'MILO PRACTICE'}</span><h2>${esc(focus||'Xem âm và từ nguyên bản trên ảnh sách')}</h2><p>${verified?'Trọng tâm này đã được xác minh.':'App không hiện âm do OCR đoán. Phần luyện bên dưới do Milo biên soạn từ từ vựng đã xác minh của Unit.'}</p></section>${phonicsGuide(unit,words)}<section class="lesson-practice-zone">${practiceHeader('Nghe – phân biệt – nói lại')}<div class="pronunciation-action-grid"><button data-say="${enc(words[0]?.[0]||unit.pattern?.[1]||'')}" data-rate=".56">🐢 Nghe âm/từ chậm</button><button data-open-pronunciation data-pronunciation-target="${esc(words[0]?.[0]||unit.pattern?.[1]||'')}">🎤 Chấm một từ</button><button data-open-pronunciation data-pronunciation-target="${esc(unit.pattern?.[1]||'')}">💬 Chấm cả câu</button></div></section>`;
    }else if(type.startsWith('Grammar')){
      const focus=verified?(content.focus||[]):[];const checks=verified?(content.checks||[]):[];const check=checks.find(Array.isArray);
      body+=studentSourceGate(section,type)+`<section class="dynamic-grammar-board"><span>${verified?esc(type):'MILO PRACTICE'}</span><h2>${verified?(focus.map(item=>esc(item)).join(' · ')||'Cấu trúc đã xác minh'):'Đọc quy tắc nguyên bản trên ảnh sách'}</h2><p>${verified?'Quy tắc này đã xác minh từ ảnh.':'App không hiển thị tên quy tắc hoặc câu do OCR đoán. Phần giải thích và bài tập dưới đây là Milo Practice theo phạm vi Unit.'}</p></section>`+teacherMode('Dùng cấu trúc đúng trong câu',check?.[5]||'Nhìn chủ ngữ, thời gian và ý nghĩa rồi chọn dạng câu phù hợp.',`Bước 1: tìm chủ ngữ. Bước 2: xác định thời gian. Bước 3: chọn động từ hoặc trợ động từ. Bước 4: đọc lại cả câu để kiểm tra nghĩa.`)+lessonExamples((check?.[6]||unit.pattern||[]).slice(0,2).map(en=>bilingualExample(en,`Câu luyện thêm theo phạm vi Unit.`,'Milo Practice; không ghi là nguyên văn sách.')))+`<section class="lesson-practice-zone">${practiceHeader('Luyện cấu trúc')}${check?choice(esc(check[2]||'Chọn đáp án đúng'),check[4]||[check[3]],check[3]):choice(`Chọn câu đúng với mẫu của Unit.`,uniqueOptions(unit.pattern?.[1],otherUnits.map(item=>item.pattern?.[1])),unit.pattern?.[1])}${choice('Sau khi chọn đáp án, con nên làm gì?', ['Đọc lại và giải thích vì sao','Bấm ngẫu nhiên câu khác','Bỏ qua nghĩa','Đổi Unit'], 'Đọc lại và giải thích vì sao')}</section>`;
    }else if(type==='Reading 1'||type==='Reading 2'){
      body+=safeReadingPractice(unit,type,content,otherUnits);
    }else if(type==='Reading Skill'){
      body+=studentSourceGate(section,'Reading Skill')+`<section class="book-skill-card"><span>🧭 READING SKILL</span><h2>${esc(content.skill||'Đọc tiêu đề, tranh và từ khóa để dự đoán nội dung')}</h2><ol><li>Xem tiêu đề và tranh trước.</li><li>Đọc câu hỏi để biết cần tìm gì.</li><li>Gạch từ khóa và tìm câu làm bằng chứng.</li><li>Trả lời rồi chỉ ra bằng chứng.</li></ol></section><section class="lesson-practice-zone">${practiceHeader('Luyện kỹ năng đọc')}${choice('Bước đầu tiên trước khi đọc chi tiết là gì?',['Xem tiêu đề và tranh','Dịch từng từ','Chọn đáp án ngay','Bỏ qua câu hỏi'],'Xem tiêu đề và tranh')}</section>`;
    }else if(type==='Listening'){
      const sample=content.sample||unit.sample;
      body+=studentSourceGate(section,'Mục tiêu Listening')+`<section class="milo-audio-disclaimer"><span>🎧</span><div><b>${esc(content.audioLabel||'Audio luyện tập do Milo tạo')}</b><p>Đây không phải audio gốc của sách. Milo tạo audio từ phạm vi từ vựng và mẫu câu của Unit để luyện ý chính và chi tiết.</p></div></section><section class="audio-studio"><div class="waveform">${Array.from({length:30},(_,i)=>`<i style="height:${18+(i*13)%44}px"></i>`).join('')}</div><h2>${esc(content.objective||'Nghe ý chính và chi tiết')}</h2><div class="button-row centered"><button class="primary-button" data-say="${enc(sample)}">▶ Nghe tốc độ chuẩn</button><button class="secondary-button" data-say="${enc(sample)}" data-rate=".62">🐢 Nghe chậm</button></div></section>${lessonExamples([bilingualExample(unit.pattern?.[1],`Câu mẫu trong chủ đề ${unit.vi}.`,'Nghe từ khóa trước, sau đó nghe chi tiết.')])}<section class="lesson-practice-zone">${practiceHeader('Nghe 2 lượt và trả lời')}${choice('Lượt nghe đầu tiên dùng để làm gì?',['Nắm ý chính','Chép mọi từ','Dịch ngay','Bỏ qua'],'Nắm ý chính')}${choice('Lượt nghe thứ hai dùng để làm gì?',['Tìm chi tiết và kiểm tra đáp án','Chỉ nghe nhạc nền','Đoán chủ đề khác','Dừng bài'],'Tìm chi tiết và kiểm tra đáp án')}</section>`;
    }else if(type==='Speaking/Communication'){
      const pattern=content.pattern||unit.pattern||[];
      body+=studentSourceGate(section,'Mẫu Speaking/Communication')+`<section class="pattern-board"><div class="pattern-line question-line"><span>QUESTION</span><b>${esc(pattern[0]||'')}</b><p>Tiếng Việt: Câu hỏi giao tiếp theo chủ đề ${esc(unit.vi)}.</p><button data-say="${enc(pattern[0]||'')}">🔊</button></div><div class="pattern-line answer-line"><span>ANSWER</span><b>${esc(pattern[1]||'')}</b><p>Tiếng Việt: Câu trả lời mẫu; con thay thông tin bằng câu thật của mình.</p><button data-say="${enc(pattern[1]||'')}">🔊</button></div></section><section class="roleplay-steps"><h3>Role-play từng bước</h3><ol><li>Nghe câu hỏi hai lần.</li><li>Nói theo câu trả lời mẫu.</li><li>Thay một từ bằng thông tin của con.</li><li>Nói cả đoạn với Milo.</li></ol><div class="button-row"><button data-open-pronunciation data-pronunciation-target="${esc(pattern[1]||'')}" class="secondary-button">🎤 Chấm câu trả lời</button><button class="primary-button" data-open-journey-ai>💬 Hội thoại với AI</button></div></section>`;
    }else if(type==='Writing'){
      const key=`milo-source-writing-${state.grade}-${state.unit}`;
      const task=content.task||unit.writing||'';
      body+=studentSourceGate(section,'Yêu cầu Writing')+`<section class="writing-brief"><span class="card-label">WRITING</span><h2>${esc(task)}</h2><p>${verified?'Yêu cầu đã xác minh từ ảnh.':'Yêu cầu đang chờ đối chiếu; khung hướng dẫn bên dưới là Milo Practice.'}</p></section><section class="writing-scaffold"><h3>Viết từng bước</h3><div><article><span>1</span><b>Lập ý</b><p>Chọn 3–5 từ của Unit.</p></article><article><span>2</span><b>Mở đầu</b><p>Viết một câu giới thiệu chủ đề.</p></article><article><span>3</span><b>Phát triển</b><p>Viết 2–4 câu có ví dụ hoặc chi tiết.</p></article><article><span>4</span><b>Kết thúc</b><p>Viết câu kết và đọc lại.</p></article></div></section><section class="writing-workspace" data-dynamic-writing="${esc(key)}"><div class="writing-toolbar"><b>Bài viết của em</b><span class="count" data-dynamic-word-count>0 từ</span></div><textarea data-dynamic-writing-area placeholder="Write here..."></textarea><div class="writing-checklist"><label><input type="checkbox"> Đúng chủ đề</label><label><input type="checkbox"> Có từ Unit</label><label><input type="checkbox"> Có chữ hoa và dấu câu</label></div><div class="writing-actions"><button class="primary-button" data-dynamic-writing-save>💾 Lưu bài</button><button class="secondary-button" data-open-journey-ai>🦊 AI chữa bằng tiếng Việt</button></div></section>`;
    }else if(type==='Writing Skill'){
      body+=studentSourceGate(section,'Writing Skill')+`<section class="book-skill-card"><span>📝 WRITING SKILL</span><h2>${esc(content.skill||'Lập ý → viết câu → kiểm tra')}</h2><ol><li>Đọc mẫu và xác định bố cục.</li><li>Lập danh sách từ/câu sẽ dùng.</li><li>Viết bản đầu.</li><li>Kiểm tra chữ hoa, dấu câu và đúng chủ đề.</li></ol></section>`;
    }else if(type==='Value'){
      body+=studentSourceGate(section,'Value')+`<section class="value-source-card"><span>💛 VALUE</span><h2>${esc(content.value||unit.value||'')}</h2><p>Milo giải thích: giá trị này cần được thể hiện bằng hành động thật, không chỉ ghi nhớ từ.</p></section><section class="lesson-practice-zone">${practiceHeader('Biến Value thành hành động')}${choice('Cách học Value tốt nhất là gì?',['Nêu một hành động thật','Chỉ đọc tiêu đề','Bỏ qua ví dụ','Học thuộc không hiểu'],'Nêu một hành động thật')}</section>`;
    }else if(type==='CLIL/Content'){
      const groups=content.groups||[];
      body+=studentSourceGate(section,'CLIL/Content')+`<section class="clil-source-card"><span>🌍 CLIL / CONTENT</span><h2>Kết nối tiếng Anh với kiến thức thế giới</h2><div>${groups.map(group=>`<article><b>${esc(group.label)}</b><p>${(group.terms||[]).map(term=>esc(term)).join(' · ')}</p></article>`).join('')}</div></section><section class="milo-practice-panel"><span class="origin-pill">MILO PRACTICE</span><h3>Nhiệm vụ cuối</h3><p>Chọn một khái niệm, vẽ hoặc tìm hình minh họa, rồi nói 2 câu tiếng Anh dùng từ của Unit.</p></section>`;
    }else if(type==='Culture'){
      body+=studentSourceGate(section,'Culture')+`<section class="culture-source-card"><span>🏛️ CULTURE</span><h2>Nội dung văn hóa đang chờ xác minh</h2><p>Học sinh không nhìn thấy OCR chưa sạch. Phụ huynh/quản trị có thể mở khu đối chiếu để kiểm tra ảnh nguồn.</p></section>`;
    }else if(type==='Project'){
      body+=studentSourceGate(section,'Project')+`<section class="project-hero"><div class="project-art">${unit.icon}</div><div><span class="card-label">PROJECT</span><h2>${esc(content.task||unit.project||'')}</h2><p>${verified?'Chủ đề Project đã xác minh.':'Chủ đề đang chờ đối chiếu; checklist là Milo Practice.'}</p></div></section><section class="project-plan"><h3>Sản phẩm cuối và checklist</h3><label><input type="checkbox"><span>1</span><b>Chọn 5 từ đã học trong Unit.</b></label><label><input type="checkbox"><span>2</span><b>Dùng ít nhất một mẫu câu/ngữ pháp của Unit.</b></label><label><input type="checkbox"><span>3</span><b>Thêm hình hoặc sản phẩm trực quan.</b></label><label><input type="checkbox"><span>4</span><b>Trình bày bằng tiếng Anh và tự đánh giá.</b></label></section>`;
    }else if(type==='Review/Unit Check'){
      body+=studentSourceGate(section,'Review/Unit Check')+`<section class="unit-check-scope"><span>✅ UNIT CHECK</span><h2>Chỉ kiểm tra kiến thức đã xuất hiện trong Unit</h2><p><b>Từ vựng:</b> ${(content.allowedVocabulary||[]).map(item=>esc(item)).join(' · ')}</p><p><b>Ngữ pháp:</b> ${(content.allowedGrammar||[]).map(item=>esc(item)).join(' · ')}</p><button class="primary-button" data-go-test>Đi đến bài kiểm tra đã khóa phạm vi →</button></section>`;
    }else{
      body+=studentSourceGate(section,section.title)+`<section class="source-review-pending"><span>📘</span><div><b>Phần này chưa có nội dung học đủ tin cậy</b><p>Ảnh nguồn vẫn được giữ nguyên và không bị mất. Hệ thống chờ đối chiếu thủ công trước khi đưa thành bài học.</p></div></section>`;
    }
    body+=`<section class="quick-check-zone">${quickCheckHeader()}<p>Hoàn thành hoạt động trong phần này rồi đánh dấu đã học. Milo sẽ lưu tiến độ và mở bài tiếp theo.</p></section>`;
    return heading(`${type.toUpperCase()} · ${verified?'ĐÃ XÁC MINH':'ĐANG ĐỐI CHIẾU'}`,icon,section.title,originLead)+body+sourceTracePanel(section)+footer();
  }

  function footer(){
    if(state.part==='test')return'';
    const route=activeModules();
    const index=route.findIndex(item=>item[0]===state.part);
    const next=route[index+1];
    const done=doneParts().includes(state.part);
    return`<div class="part-footer"><button class="complete-button ${done?'done':''}" data-complete="${state.part}">${done?'✓ Đã học xong phần này':'Đánh dấu đã học'}</button>${next?`<button class="next-button" data-next="${next[0]}">Tiếp: ${next[2]} →</button>`:''}</div>`;
  }
  function updateHeader(){
    const unit=currentUnit(),profile=currentProfile(),levelSpec=companionLevelSpec();
    $('#topTitle').textContent=`Lớp ${state.grade} · Unit ${state.unit+1}`;
    $('#unitIcon').textContent=unit.icon;$('#unitNumber').textContent=`UNIT ${state.unit+1}`;$('#unitTitle').textContent=unit.title;$('#unitVi').textContent=unit.vi;
    $('#gradeSelect').value=state.grade;
    $('#unitSelect').innerHTML=currentGrade().units.slice(0,progression.UNIT_COUNT).map((item,index)=>{const unlocked=progression.isUnitUnlocked(state.grade,index+1),target=progression.levelTargetForUnit(index+1);return`<option value="${index}" ${index===state.unit?'selected':''} ${unlocked?'':'disabled'}>${unlocked?'':'🔒 '}Unit ${index+1}: ${esc(item.title)} · ${index===11?'Hoàn thành lớp · ':''}Lv.${target}</option>`}).join('');
    $('#lessonCoachImage').src=miloEvolutionImage();
    $('#lessonCoachImage').alt=`${companionName()} Level ${miloJourneyLevel()}`;
    $('#lessonCoachWave').style.backgroundImage=`url(${miloWaveImage()})`;
    $('#lessonCoachWave').classList.add('single-pose');
    $('#lessonCoachWave').style.backgroundSize='contain';
    $('#lessonCoachWave').style.backgroundPosition='center bottom';
    $('#coachCompanionLabel').textContent=`${companionName().toUpperCase()} ĐỒNG HÀNH`;
    $('#miloRead').textContent=`🔊 ${companionName()} đọc`;
    if($('#lessonPetRewardName'))$('#lessonPetRewardName').textContent=companionName();
    $('#coachLevelIcon').textContent=levelSpec.icon;
    $('#coachLevelBadge').textContent=`LEVEL ${levelSpec.level} · CƠ THỂ ${levelSpec.growthPercent}% · ${levelSpec.appearanceName.toUpperCase()}`;
    $('#coachLevelActivityName').textContent=levelSpec.activityShort;
    $('#coachLevelActivity').textContent=`▶ Lv.${levelSpec.level}`;
    $('#coachLevelActivity').title=levelSpec.phrase;
    window.MILO_PET_LEVELS.applyMotionStyle($('.coach-image'),levelSpec);
    const gradeProgress=progression.summary(state.grade);
    if($('#lessonLevelXp'))$('#lessonLevelXp').textContent=`Lv.${gradeProgress.level} · ${gradeProgress.xp} XP`;
    if($('#lessonNextMilestone'))$('#lessonNextMilestone').textContent=gradeProgress.completedUnits.length>=12?'Hoàn thành lớp · Lv.50':`Mốc Unit ${gradeProgress.nextUnit} → Lv.${gradeProgress.nextUnitLevel}`;
    updateRewardHud();
    const currentModule=activeModules().find(item=>item[0]===state.part);
    $('#missionPartName').textContent=`Hoàn thành ${currentModule?.[2]||'bài học'} cùng ${companionName()}`;
    $('#lessonRouteBadge').textContent=`🎯 LỚP ${state.grade} · ${profile.stage.toUpperCase()} · ${profile.benchmark}`;
  }
  function renderNav(){
    const done=doneParts();
    const parts=learningParts();
    const completed=done.filter(part=>parts.includes(part));
    const percent=Math.round(completed.length/parts.length*100);
    $('#progressPercent').textContent=`${percent}%`;$('#progressBar').style.width=`${percent}%`;$('#progressText').textContent=`${completed.length}/${parts.length} phần đã học`;
    $('#coachHappy').textContent=`${companionName()} vui ${percent}%`;$('#coachProgressText').textContent=`${completed.length}/${parts.length} chặng đã chinh phục`;$('#coachProgressBar').style.width=`${percent}%`;$('#coachMood').textContent=percent>=100?'🏆':'🐾';$('#coachNextGift').textContent=`🎁 Còn ${Math.max(0,3-(done.length%3))} chặng để nhận quà bí mật`;
    const allModules=activeModules();
    const activeIndex=Math.max(0,allModules.findIndex(item=>item[0]===state.part));
    const visibleModules=navExpanded?allModules:allModules.slice(Math.max(0,activeIndex-1),activeIndex+4);
    const toggle=allModules.length>visibleModules.length?`<button class="lesson-nav-more" type="button" data-nav-expand aria-expanded="${navExpanded}">Xem tất cả ${allModules.length} phần ↓</button>`:navExpanded&&allModules.length>5?'<button class="lesson-nav-more" type="button" data-nav-expand aria-expanded="true">Thu gọn danh sách ↑</button>':'';
    $('#lessonNav').innerHTML=visibleModules.map(item=>`<button class="${item[0]===state.part?'active':''} ${done.includes(item[0])?'done':''}" data-part="${item[0]}"><span>${item[1]}</span><div><b>${item[2]}</b><small>${item[3]}</small></div>${done.includes(item[0])?'<em>✓</em>':''}</button>`).join('')+toggle;
    document.querySelectorAll('[data-part]').forEach(button=>button.onclick=()=>goPart(button.dataset.part));
    $('[data-nav-expand]')?.addEventListener('click',()=>{navExpanded=!navExpanded;renderNav();});
  }
  function goPart(part){
    state.part=part;localStorage.setItem(`milo-last-part-${state.grade}-${state.unit}`,part);location.hash=part;updateHeader();renderNav();renderContent();scrollTo({top:0,behavior:'smooth'});
  }
  function bindCommon(){
    document.querySelectorAll('[data-say]').forEach(button=>button.onclick=()=>speak(decodeURIComponent(button.dataset.say),Number(button.dataset.rate||.86)));
    document.querySelectorAll('[data-teacher-mode]').forEach(button=>button.onclick=()=>{
      const studio=button.closest('.milo-teacher-studio');
      studio?.querySelectorAll('[data-teacher-mode]').forEach(item=>item.classList.toggle('active',item===button));
      studio?.querySelectorAll('[data-teacher-copy]').forEach(item=>item.classList.toggle('active',item.dataset.teacherCopy===button.dataset.teacherMode));
    });
    document.querySelectorAll('.exercise-card[data-correct]').forEach(card=>{
      const correct=decodeURIComponent(card.dataset.correct);
      card.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
        if(card.dataset.answered)return;card.dataset.answered='1';
        const value=decodeURIComponent(button.dataset.choice);
        card.querySelectorAll('[data-choice]').forEach(item=>item.disabled=true);
        if(value===correct){button.classList.add('correct');card.querySelector('.answer-note').textContent='✓ Chính xác!';card.querySelector('.answer-note').classList.add('good');speak('Correct! Well done!')}
        else{button.classList.add('wrong');[...card.querySelectorAll('[data-choice]')].find(item=>decodeURIComponent(item.dataset.choice)===correct)?.classList.add('correct');card.querySelector('.answer-note').textContent=`Đáp án đúng: ${correct}`;card.querySelector('.answer-note').classList.add('bad');speak(`Good try. The correct answer is ${correct}.`)}
      });
    });
    $('[data-complete]')?.addEventListener('click',event=>savePart(event.currentTarget.dataset.complete));
    $('[data-next]')?.addEventListener('click',event=>goPart(event.currentTarget.dataset.next));
    document.querySelectorAll('[data-source-mastered]').forEach(input=>input.onchange=()=>{
      const key=`milo-source-mastery-${state.grade}-${state.unit}`;
      const saved=new Set(JSON.parse(localStorage.getItem(key)||'[]'));
      if(input.checked)saved.add(input.dataset.sourceMastered);else saved.delete(input.dataset.sourceMastered);
      localStorage.setItem(key,JSON.stringify([...saved]));
      input.closest('.scope-term')?.classList.toggle('mastered',input.checked);
      setMilo(input.checked?'Đã lưu từ này. Tiếp tục nhé!':'Đã bỏ đánh dấu; em có thể luyện lại.');
    });
  }
  function renderContent(){
    const microLesson=window.MILO_MICRO_LESSON_V60_19;
    if(microLesson?.canHandle?.(state.grade,state.unit,state.part)){
      microLesson.mountCurrent();
      $('#coachTip').textContent='Milo đang dẫn con qua ba giai đoạn: học chuyên sâu, luyện có hướng dẫn và kiểm tra.';
      return;
    }
    microLesson?.leaveFocus?.();
    const unit=currentUnit(),grade=currentGrade(),otherUnits=grade.units.filter((_,index)=>index!==state.unit);
    const words=unit.words;
    let html='';
    const sourceSection=currentSourceSection();
    const dynamicBookSection=sourceSection&&sourceSection.contentOrigin==='book_source'&&!['sourcebook','test'].includes(sourceSection.id);
    if(dynamicBookSection){
      html=renderDynamicSourceSection(sourceSection,unit,otherUnits,words);
    }
    if(state.part==='sourcebook'){
      const sourcebook=state.grade===2?window.MILO_GRADE2_SOURCEBOOK:state.grade===3?window.MILO_GRADE3_SOURCEBOOK:null;
      if(sourcebook)html=sourcebook.render({unitIndex:state.unit,footer});
    }
    if(state.part==='vipmax'){
      const pack=window.MILO_VIP_PRO_MAX?.get(unit,state.grade,state.unit);
      if(pack){
        const coverageLabels={
          bigQuestion:'Big Question',
          vocabulary:'Vocabulary',
          grammar:'Grammar',
          phonics:'Phonics',
          reading:'Reading',
          listening:'Listening',
          speaking:'Speaking',
          writing:'Writing',
          project:'Project',
          assessment:'Assessment'
        };
        html=
          heading(`UNIT ${state.unit+1} · VIP PRO MAX`,'👑','Bản đồ học tập kiểm soát từng đầu ra','Phụ huynh nhìn được học gì, học theo thứ tự nào, đạt đến đâu và phải học lại phần nào trước khi mở Unit tiếp theo.')+
          `<section class="vip-max-hero"><div><small>${esc(pack.level)} · ${esc(pack.benchmark)}</small><h2>${esc(unit.title)}</h2><p>${esc(unit.vi)} · ${pack.sessions.length} buổi có mục tiêu rõ ràng, hoạt động thực hành và sản phẩm kiểm chứng.</p></div><aside><b>${pack.lessonMinutes} phút / buổi chính</b><span>Chuẩn đạt ${pack.coverage.assessment}</span></aside></section>`+
          `<section class="vip-policy"><span>🛡️</span><div><b>Cam kết nội dung hợp pháp</b>${esc(pack.policy)}</div></section>`+
          (unit.alignment?`<section class="scope-coverage-strip"><div><small>PHẠM VI TỪ VỰNG</small><b>${alignmentWords(unit).length} mục từ</b></div><div><small>MỤC TIÊU KỸ NĂNG</small><b>5/5 nhóm</b></div><div><small>DẠNG LUYỆN</small><b>${unit.alignment.exerciseTypes.length} dạng</b></div><div><small>TÀI SẢN CÓ BẢN QUYỀN</small><b>Không sao chép</b></div></section>`:'')+
          `<section class="vip-coverage-grid">${Object.entries(pack.coverage).map(([key,value])=>`<article><small>${esc(coverageLabels[key]||key)}</small><b>${esc(value)}</b></article>`).join('')}</section>`+
          `<section class="vip-goals"><h2>Sau Unit này, học sinh phải làm được</h2><ol>${pack.outcomes.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></section>`+
          `<section class="vip-session-board"><h2>Lộ trình VIP Max · 12 buổi</h2><div class="vip-sessions">${pack.sessions.map((session,index)=>`<article class="vip-session"><span>${session.icon}</span><div><small>BUỔI ${index+1}</small><b>${esc(session.title)}</b><p>${esc(session.focus)}</p><em>Đầu ra: ${esc(session.output)}</em></div></article>`).join('')}</div></section>`+
          `<section class="vip-rubric"><h2>Rubric đạt chuẩn và hướng học lại</h2><div class="vip-rubric-grid">${pack.rubric.map(item=>`<article><h3>${item.icon} ${esc(item.skill)}</h3><p><b>Đạt:</b> ${esc(item.ready)}</p><p><b>Cần học lại:</b> ${esc(item.review)}</p></article>`).join('')}</div></section>`+
          `<section class="vip-home-plan"><h2>Kế hoạch học 7 ngày tại nhà</h2><ol>${pack.homePlan.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></section>`+
          footer();
      }
    }
    if(state.part==='warmup'){
      html=
        heading(`UNIT ${state.unit+1} · KHỞI ĐỘNG`,unit.icon,unit.title,`Bắt đầu bằng tình huống thật về ${unit.vi.toLowerCase()}, sau đó xác định điều em sẽ nói được sau Unit.`)+
        `<section class="teacher-explain"><span>📘</span><div><span class="card-label">${esc(unit.reference)}</span><b>Nội dung học tập Milo biên soạn mới</b><p>${esc(unit.contentPolicy)}</p></div></section>`+
        `<section class="scenario-banner"><div><span class="card-label">TÌNH HUỐNG HÔM NAY</span><h2>Em gặp ${companionName()} và bắt đầu một cuộc trò chuyện</h2><p>Nghe trọn hội thoại trước. Lần đầu chưa cần dịch từng từ; hãy chú ý câu hỏi và cách người nghe phản hồi.</p></div><div class="dialogue-card"><p><b>${companionName()} hỏi</b><span>${esc(unit.pattern[0])}</span></p><p><b>Em đáp</b><span>${esc(unit.pattern[1])}</span></p><button data-say="${enc(unit.pattern.join(' '))}">🔊 Nghe hội thoại mở đầu</button></div></section>`+
        sourceLessonMap(unit)+
        sourceKnowledgePanel(unit)+
        `<div class="two-column-content"><section class="teaching-card"><span class="card-label">SAU UNIT NÀY, EM CÓ THỂ</span><ul class="goal-list"><li><span>1</span> Học nhanh ${words.length} từ trọng tâm; tra cứu thêm ${alignmentWords(unit).length} mục từ theo nhóm.</li><li><span>2</span> Hỏi: <b>${esc(unit.pattern[0])}</b></li><li><span>3</span> Trả lời: <b>${esc(unit.pattern[1])}</b></li><li><span>4</span> Ngữ pháp: <b>${esc((unit.grammarFocus||[]).join(' · '))}</b></li></ul></section><section class="teaching-card"><span class="card-label">TỪ KHÓA SẮP HỌC</span><div class="preview-words">${words.map(word=>`<button data-say="${enc(word[0])}"><span>${word[2]}</span><b>${esc(word[0])}</b></button>`).join('')}</div></section></div>`+
        alignmentObjectives(unit)+
        choice(`${companionName()} hỏi: <b>${esc(unit.pattern[0])}</b> Em nên trả lời câu nào?`,uniqueOptions(unit.pattern[1],otherUnits.map(item=>item.pattern[1])),unit.pattern[1])+footer();
    }
    if(state.part==='vocabulary'){
      html=
        heading('BÀI 1 · VOCABULARY','📚','Học từ mới trong ngữ cảnh','Không học từ rời rạc: mỗi từ có hình gợi nhớ, nghĩa, âm đọc và câu ví dụ lấy từ chính Unit.')+
        `<section class="teacher-explain"><span>👩‍🏫</span><div><b>Cách học 5 bước</b><p>Nhìn hình → nghe từ → đọc hai ví dụ → áp dụng ngay → trả lời đúng để mở từ tiếp theo.</p></div></section>`+
        `<div id="wordTrainer"></div>`+
        alignmentWordBank(unit)+footer();
    }
    if(state.part==='phonics'){
      html=
        heading('BÀI 2 · PHONICS','🔤','Phát âm và nhịp điệu','Nghe âm trọng tâm, nhận ra âm trong từ, rồi đưa âm đó vào câu giao tiếp.')+
        phonicsGuide(unit,words)+footer();
    }
    if(state.part==='language'){
      html=
        heading('BÀI 3 · LANGUAGE FOCUS','🧠','Hiểu và dùng mẫu câu','Milo giải thích khi nào dùng, cấu trúc câu và cách thay thông tin để nói về chính em.')+
        `<section class="teacher-explain large"><span>👩‍🏫</span><div><span class="card-label">CÁCH DÙNG</span><h2>${esc(explainPattern(unit.pattern[0]))}</h2></div></section>`+
        `<section class="pattern-board"><div class="pattern-line question-line"><span>QUESTION</span><b>${esc(unit.pattern[0])}</b><button data-say="${enc(unit.pattern[0])}">🔊</button></div><div class="pattern-line answer-line"><span>ANSWER</span><b>${esc(unit.pattern[1])}</b><button data-say="${enc(unit.pattern[1])}">🔊</button></div></section>`+
        `<div class="two-column-content"><section class="teaching-card"><span class="card-label">TRỌNG TÂM NGỮ PHÁP UNIT</span><h3>${esc((unit.grammarFocus||[]).join(' · '))}</h3><p>Học từng cấu trúc trong câu có nghĩa, sau đó thay thông tin để tạo câu của riêng em.</p></section><section class="teaching-card"><span class="card-label">NGÂN HÀNG TỪ</span><div class="word-bank">${words.map(word=>`<span>${word[2]} ${esc(word[0])}</span>`).join('')}</div><p>Dùng các từ trên để tạo câu mới.</p></section></div>`+
        alignmentObjectives(unit)+
        choice(`Chọn phản hồi phù hợp nhất cho: <b>${esc(unit.pattern[0])}</b>`,uniqueOptions(unit.pattern[1],otherUnits.map(item=>item.pattern[1])),unit.pattern[1])+sentenceBuilder(unit.pattern[1])+footer();
    }
    if(state.part==='grammar'){
      html=
        heading('ENHANCED TRACK · GRAMMAR','🚀','Ngữ pháp tăng dần theo Level','Bắt đầu từ trật tự câu cơ bản, sau đó mở khóa số lượng, thì, từ nối và cấu trúc nâng cao.')+
        `<div id="grammarLab"></div>`+footer();
    }
    if(state.part==='milo-grammar-levels'){
      html=
        heading('MILO PRACTICE · GRAMMAR LEVELS','🚀','Ngữ pháp tăng dần theo Level','Đây là phần luyện thêm do Milo biên soạn từ phạm vi ngữ pháp của Unit; không phải mục nguyên bản của sách.')+
        `<section class="book-source-boundary milo-practice-boundary"><b>🦊 Luyện thêm do Milo biên soạn:</b> Level 1–5 giúp củng cố cấu trúc đã xuất hiện trong Unit. Nội dung này không được gắn nhãn BOOK SOURCE.</section>`+
        `<div id="grammarLab"></div>`+sourceTracePanel(sourceSection)+footer();
    }
    if(state.part==='listening'){
      const tracks=window.MILO_EXPERT_PROGRAM?.listeningTracks(unit,state.grade)||[{title:'Track A',script:unit.sample}];
      const sourceAudioNote=tracks.some(track=>track.bookAudioVerified===false)
        ?'<section class="teaching-card source-audio-note"><span class="card-label">NGUỒN ÂM THANH</span><p>Bài nghe này do Milo biên soạn và đọc bằng giọng trên máy theo mục tiêu Unit; không phải tệp audio gốc của sách.</p></section>'
        :'';
      html=
        heading('BÀI 4 · LISTENING','🎧','Nghe hai Track: ý chính → chi tiết','Track A luyện bắt chủ đề và phản hồi; Track B luyện ghi chú, trình tự và chi tiết quan trọng.')+
        sourceAudioNote+
        tracks.map((track,index)=>`<section class="audio-studio"><div class="waveform">${Array.from({length:30},(_,bar)=>`<i style="height:${18+((bar*17+index*9)%48)}px"></i>`).join('')}</div><h2>${esc(track.title)}</h2><p>${index===0?'Nghe lần đầu không nhìn lời.':'Ghi lại ít nhất ba từ khóa trước khi mở lời nghe.'}</p><div class="button-row centered"><button class="primary-button" data-say="${enc(track.script)}">▶ Nghe tốc độ chuẩn</button><button class="secondary-button" data-say="${enc(track.script)}" data-rate=".62">🐢 Nghe chậm</button></div></section>`).join('')+
        `<div class="exercise-split">${choice('Bài nghe nói chủ yếu về nội dung nào?',uniqueOptions(unit.vi,otherUnits.map(item=>item.vi)),unit.vi)}${choice(`Nghe câu ngắn và chọn câu đúng. <button class="inline-audio" data-say="${enc(unit.pattern[1])}">🔊 Nghe</button>`,uniqueOptions(unit.pattern[1],otherUnits.map(item=>item.pattern[1])),unit.pattern[1])}</div>`+
        choice(`Đúng hay sai: bài nghe có nhắc đến từ “<b>${esc(words[0][0])}</b>”.`,['Đúng','Sai'],unit.sample.toLowerCase().includes(words[0][0].toLowerCase())?'Đúng':'Sai')+
        `<section class="transcript-card"><div><span class="card-label">LỜI HAI TRACK</span><b>Chỉ mở sau khi đã nghe và ghi từ khóa.</b></div><button id="toggleTranscript">Hiện lời nghe</button><div id="transcript" class="hidden">${tracks.map(track=>`<p><b>${esc(track.title)}</b><br>${esc(track.script)}</p>`).join('')}</div></section>`+footer();
    }
    if(state.part==='speaking'){
      html=
        heading('BÀI 5 · SPEAKING','💬',`Hội thoại trực tiếp với ${companionName()}`,'Nghe câu hỏi, chuẩn bị ý, sau đó nói bằng micro hoặc gõ câu trả lời bằng tiếng Anh.')+
        `<section class="roleplay-stage"><div class="roleplay-milo"><div class="roleplay-milo-art"><img src="${miloEvolutionImage()}" alt="${companionName()} Level ${miloJourneyLevel()}"><span class="milo-wave-sprite single-pose" aria-hidden="true" style="background-image:url(${miloWaveImage()});background-size:contain;background-position:center bottom"></span></div><span>${companionName().toUpperCase()} · LV.${miloJourneyLevel()}</span></div><div class="roleplay-dialogue"><span class="card-label">VÒNG 1 · HỎI VÀ TRẢ LỜI</span><h2>${esc(unit.pattern[0])}</h2><button class="audio-button" data-say="${enc(unit.pattern[0])}">🔊 ${companionName()} hỏi em</button></div></section>`+
        `<section class="speaking-console"><div class="speaking-guide"><span class="card-label">CÂU MẪU</span><p>${esc(unit.pattern[1])}</p><button data-say="${enc(unit.pattern[1])}">🔊 Nghe câu mẫu</button><button type="button" data-open-pronunciation data-pronunciation-target="${esc(unit.pattern[1])}">🎯 Kiểm tra phát âm câu này</button></div><div class="speaking-answer"><label>Đến lượt em trả lời</label><div><button class="mic-button" id="speakingMic">🎤</button><input id="speakingInput" placeholder="Gõ hoặc nói câu trả lời…"><button id="checkSpeaking">${companionName()} kiểm tra</button></div><p id="speakingFeedback"></p></div></section>`+
        `<section class="teaching-card"><span class="card-label">VÒNG 2 · NÓI VỀ CHÍNH EM</span><h3>Thay thông tin trong câu mẫu bằng một thông tin thật của em.</h3><div class="word-bank">${words.map(word=>`<span>${word[2]} ${esc(word[0])}</span>`).join('')}</div></section>`+footer();
    }
    if(state.part==='reading'){
      const bundle=window.MILO_EXPERT_PROGRAM?.readingBundle(unit,state.grade);
      const readingParts=bundle
        ?[
          {title:bundle.sourceATitle||'Reading 1 · Fiction & Values',text:bundle.sourceA},
          {title:bundle.sourceBTitle||'Reading 2 · Factual & CLIL',text:bundle.sourceB}
        ].filter(item=>item.text)
        :[{title:'Reading text',text:readingPassage(unit,grade)}];
      const reading=readingParts.map(item=>item.text).join(' ');
      html=
        heading('BÀI 6 · READING','📖','Hai bài đọc cho mỗi Big Question',`Reading 1 luyện truyện và giá trị sống; Reading 2 mở rộng kiến thức thực tế/CLIL theo đúng mức lớp ${state.grade}: ${currentProfile().reading}.`)+
        sourceKnowledgePanel(unit)+
        `<section class="reading-strategy"><span>🔎</span><div><b>4 bước đọc hiểu</b><p>Đọc tiêu đề → gạch từ đã học → đọc câu hỏi → quay lại tìm bằng chứng.</p></div></section>`+
        `<article class="reading-paper"><div class="reading-paper-top"><span>TWO READING TEXTS · NOW I KNOW ALIGNMENT</span><button data-say="${enc(reading)}">🔊 Nghe cả hai bài</button></div><h2>${esc(unit.title)}</h2>${readingParts.map(part=>`<section class="reading-source"><b>${esc(part.title)}</b><p>${esc(part.text)}</p></section>`).join('')}<div class="reading-meta"><span>${reading.trim().split(/\s+/).length} words</span><span>Level: Grade ${state.grade}</span></div></article>`+
        `<div class="exercise-split">${choice('Ý chính của bài đọc là gì?',uniqueOptions(unit.title,otherUnits.map(item=>item.title)),unit.title)}${choice(`Trong bài, “<b>${esc(words[0][0])}</b>” nghĩa là gì?`,uniqueOptions(words[0][1],words.map(word=>word[1])),words[0][1])}</div>`+
        choice(`Chọn câu ví dụ có từ “<b>${esc(words[4][0])}</b>”.`,uniqueOptions(wordExamples(words[4],unit)[0],words.slice(0,4).map(word=>wordExamples(word,unit)[0])),wordExamples(words[4],unit)[0])+footer();
    }
    if(state.part==='writing'){
      const range=targetRange(currentProfile().writing,state.grade===2?[3,10]:[10,20]);
      const key=`milo-writing-${state.grade}-${state.unit}`;
      html=
        heading('BÀI 7 · WRITING','✍️','Viết đoạn có hướng dẫn','Không viết ngay từ trang trắng: em lập ý, chọn từ, dùng câu khung rồi mới hoàn thiện đoạn.')+
        `<section class="writing-brief"><span class="card-label">ĐỀ BÀI</span><h2>${esc(unit.writing)}</h2><div class="writing-targets"><span>🎯 ${range[0]}–${range[1]} từ</span><span>📚 Dùng từ mới</span><span>✅ Có dấu câu</span></div></section>`+
        `<section class="planning-board"><h3>Trước khi viết: lập kế hoạch 3 bước</h3><div><article><span>1</span><b>Chọn ý</b><p>Em muốn nói điều gì về bản thân hoặc chủ đề?</p></article><article><span>2</span><b>Chọn từ</b><p>${words.map(word=>word[0]).join(' · ')}</p></article><article><span>3</span><b>Dùng câu khung</b><p>${esc(unit.pattern[1])}</p></article></div></section>`+
        `<section class="writing-workspace"><div class="writing-toolbar"><b>Bài viết của em</b><span class="count" id="wordCount">0 từ</span></div><textarea id="writingArea" placeholder="Write your paragraph here…"></textarea><div class="writing-actions"><button class="primary-button" id="saveWriting">💾 Lưu bài</button><button class="secondary-button" id="checkWriting">🦊 Milo góp ý</button></div><p class="writing-feedback hidden" id="writingFeedback"></p></section>`+footer();
      setTimeout(()=>{
        const area=$('#writingArea');area.value=localStorage.getItem(key)||'';
        const count=()=>{const total=area.value.trim()?area.value.trim().split(/\s+/).length:0;$('#wordCount').textContent=`${total} từ`;$('#wordCount').classList.toggle('good',total>=range[0]&&total<=range[1]);return total};
        area.oninput=count;count();
        $('#saveWriting').onclick=()=>{localStorage.setItem(key,area.value);setMilo('Đã lưu bài viết trên máy.')};
        $('#checkWriting').onclick=()=>{const text=area.value.trim(),total=count(),notes=[];if(total<range[0])notes.push(`Viết thêm ${range[0]-total} từ để đủ ý.`);if(total>range[1])notes.push(`Bài dài hơn gợi ý ${total-range[1]} từ; có thể rút gọn.`);if(text&&!/^[A-Z]/.test(text))notes.push('Câu đầu nên bắt đầu bằng chữ hoa.');if(text&&!/[.!?]$/.test(text))notes.push('Thêm dấu câu ở cuối.');if(text&&!words.some(word=>text.toLowerCase().includes(word[0].toLowerCase())))notes.push('Dùng ít nhất một từ mới của Unit.');const feedback=$('#writingFeedback');feedback.classList.remove('hidden');feedback.textContent=notes.length?notes.join(' '):'Great writing! Bài đã đạt độ dài, có từ mới và hình thức câu cơ bản.'};
      });
    }
    if(state.part==='project'){
      const key=`milo-project-${state.grade}-${state.unit}`;
      const saved=JSON.parse(localStorage.getItem(key)||'[false,false,false,false]');
      const labels=['Chuẩn bị tranh, giấy hoặc đồ vật cần dùng.',`Dùng ít nhất ${Math.min(6,Math.ceil(words.length/2))} trong ${words.length} từ: ${words.map(word=>word[0]).join(', ')}.`,`Dùng mẫu câu: ${unit.pattern[1]}`,'Giới thiệu sản phẩm bằng tiếng Anh cho một người nghe.'];
      html=
        heading('VẬN DỤNG · PROJECT & CULTURE','🎨','Dùng tiếng Anh để tạo sản phẩm','Kết nối kiến thức của Unit với lớp học, gia đình và đời sống Việt Nam.')+
        `<section class="project-hero"><div class="project-art">${unit.icon}</div><div><span class="card-label">NHIỆM VỤ CỦA UNIT</span><h2>${esc(unit.project)}</h2><p>Sản phẩm không cần cầu kỳ. Điều quan trọng là em dùng được từ và mẫu câu vừa học.</p></div></section>`+
        `<section class="project-plan"><h3>Checklist thực hiện</h3>${labels.map((label,index)=>`<label class="${saved[index]?'checked':''}"><input type="checkbox" data-project="${index}" ${saved[index]?'checked':''}><span>${index+1}</span><b>${esc(label)}</b></label>`).join('')}<button class="primary-button" id="saveProject">Lưu tiến độ dự án</button></section>`+footer();
    }
    if(state.part==='games'){
      html=
        heading('MILO GAME ZONE','🎮','Ôn bài bằng trò chơi','Ba trò chơi ngắn giúp trẻ nhìn tranh, nghe âm, ghép nghĩa và xây câu bằng chính kiến thức của Unit.')+
        `<div id="gameZone"></div>`+footer();
    }
    if(state.part==='test'){
      const targetQuestions=testQuestionTarget(unit),appliedTarget={2:6,3:10,4:14,5:18}[state.grade],passTarget=Math.ceil(targetQuestions*(state.grade===2?.75:.8));
      html=heading('KIỂM TRA CUỐI UNIT','✅',`Treasure Test · ${unit.title}`,`Hoàn thành ${targetQuestions} câu có hình, âm thanh và hoạt ảnh để xem em đã nắm được kiến thức nào và cần ôn lại phần nào.`)+
        `<div class="test-intro animated-test-intro" id="testIntro"><div class="boss-intro-arena"><span class="intro-milo"><img src="${miloEvolutionImage()}" alt="${companionName()} sẵn sàng chiến đấu"></span><b>VS</b><span class="intro-boss">${bossIcons[state.unit]}</span></div><span class="test-fly butterfly">🦋</span><span class="test-fly star">⭐</span><span class="test-fly balloon">🎈</span><span class="lesson-kicker">BOSS BATTLE · TREASURE TEST</span><h2>Đối đầu ${bossNames[state.unit]}</h2><p>${targetQuestions} câu lấy trực tiếp từ nội dung vừa học. Em cần đạt ít nhất ${passTarget}/${targetQuestions} để giải cứu <b>${esc(unit.vi)}</b>.</p><ul><li>Từ vựng có hình động: nghĩa, nghe và nhận diện</li><li>${appliedTarget} câu áp dụng từ vào ngữ cảnh hoàn chỉnh</li><li>Mẫu câu, giao tiếp, nghe và phát âm theo Unit</li></ul><div class="boss-reward"><span>🎁</span><b>${bossRewards[state.unit]} · 50 ⭐</b></div><button class="primary-button" id="startTest">⚔️ Bắt đầu chiến đấu →</button></div><div id="testRunner"></div>`;
    }
    $('#lessonContent').innerHTML=html;
    bindCommon();
    bindPart();
    $('#coachTip').textContent=sourceSection?.contentOrigin==='book_source'?'Mở “Nguồn đối chiếu” để xem ZIP, tên ảnh và trang sách của phần đang học.':state.part==='sourcebook'?'Mở từng ảnh, phóng to và đối chiếu ảnh nguồn đầy đủ để không bỏ sót nội dung.':state.part==='vipmax'?'Đi đúng lộ trình 12 buổi và chỉ mở Unit tiếp khi đạt chuẩn.':state.part==='milo-grammar-levels'?'Đây là phần luyện thêm Milo, không phải mục nguyên bản của sách.':state.part==='listening'?'Nghe ít nhất hai lần trước khi mở lời bài nghe.':state.part==='speaking'?'Nói thành câu đầy đủ, chưa cần quá nhanh.':state.part==='reading'?'Tìm từ khóa thay vì dịch từng từ.':state.part==='writing'?'Lập ý trước, viết sau và luôn đọc lại.':'Học từng bước và làm bài luyện ngay bên dưới.';
  }
  function bindPart(){
    const unit=currentUnit(),grade=currentGrade();
    document.querySelectorAll('[data-source-jump]').forEach(button=>button.onclick=()=>goPart(button.dataset.sourceJump||'sourcebook'));
    document.querySelectorAll('[data-source-asset]').forEach(button=>button.onclick=()=>{
      sessionStorage.setItem('milo-source-open-asset',button.dataset.sourceAsset||'');
      goPart('sourcebook');
    });
    document.querySelectorAll('[data-go-test]').forEach(button=>button.onclick=()=>goPart('test'));
    document.querySelectorAll('[data-dynamic-writing]').forEach(workspace=>{
      const key=workspace.dataset.dynamicWriting;
      const area=workspace.querySelector('[data-dynamic-writing-area]');
      const count=workspace.querySelector('[data-dynamic-word-count]');
      const update=()=>{const total=area.value.trim()?area.value.trim().split(/\s+/).length:0;count.textContent=`${total} từ`;return total};
      area.value=localStorage.getItem(key)||'';
      area.oninput=update;update();
      workspace.querySelector('[data-dynamic-writing-save]')?.addEventListener('click',()=>{localStorage.setItem(key,area.value);setMilo('Đã lưu bài viết trên máy.')});
    });
    document.querySelectorAll('[data-open-journey-ai]').forEach(button=>button.onclick=()=>{
      const floating=document.querySelector('[data-ai-journey-open],#journeyAiOpen,#floatingAiButton,.ai-journey-floating button');
      if(floating)floating.click();else setMilo('Trợ lý AI đang sẵn sàng ở nút nổi bên phải màn hình.');
    });
    if(state.part==='sourcebook'){
      const sourcebook=state.grade===2?window.MILO_GRADE2_SOURCEBOOK:state.grade===3?window.MILO_GRADE3_SOURCEBOOK:null;
      sourcebook?.bind({unitIndex:state.unit,setMilo});
      const requestedAsset=sessionStorage.getItem('milo-source-open-asset')||'';
      if(requestedAsset){sessionStorage.removeItem('milo-source-open-asset');sourcebook?.openAsset?.(requestedAsset)}
    }
    if(state.part==='vocabulary')renderWordTrainer();
    if(state.part==='grammar'||state.part==='milo-grammar-levels')renderGrammarLab();
    if(state.part==='games')renderGameZone();
    if(state.part==='language'){
      const built=[],builder=$('#sentenceBuilder'),line=$('#sentenceLine'),check=$('#checkSentence');
      builder.querySelectorAll('[data-token]').forEach(button=>button.onclick=()=>{built.push(decodeURIComponent(button.dataset.token));button.disabled=true;line.innerHTML=built.map(token=>`<span>${esc(token)}</span>`).join('');check.disabled=[...builder.querySelectorAll('[data-token]')].some(item=>!item.disabled)});
      check.onclick=()=>{const target=decodeURIComponent(builder.dataset.target).toLowerCase(),answer=built.join(' ').toLowerCase(),note=$('#sentenceNote');note.textContent=answer===target?'✓ Câu chính xác!':'Chưa đúng thứ tự, thử lại nhé.';note.className=`answer-note ${answer===target?'good':'bad'}`;setMilo(answer===target?'Perfect! Em đã sắp xếp đúng mẫu câu.':'Thứ tự chưa đúng. Em thử nhìn lại câu mẫu nhé.');if(answer===target)speak(decodeURIComponent(builder.dataset.target))};
      $('#resetSentence').onclick=()=>renderContent();
    }
    if(state.part==='listening'){
      let shown=false;$('#toggleTranscript').onclick=()=>{shown=!shown;$('#transcript').classList.toggle('hidden',!shown);$('#toggleTranscript').textContent=shown?'Ẩn lời nghe':'Hiện lời nghe'};
    }
    if(state.part==='speaking'){
      const input=$('#speakingInput'),feedback=$('#speakingFeedback');
      $('#checkSpeaking').onclick=()=>{const text=input.value.trim();if(text.split(/\s+/).length<2){feedback.textContent='Em hãy trả lời bằng một câu đầy đủ hơn.';return}const uses=unit.words.some(word=>text.toLowerCase().includes(word[0].toLowerCase()))||text.toLowerCase().split(/\s+/).some(word=>unit.pattern[1].toLowerCase().includes(word));feedback.textContent=uses?'Great! Em đã dùng đúng ngôn ngữ của Unit.':'Câu đã có ý. Em thử thêm một từ mới của Unit nhé.';setMilo(feedback.textContent)};
      $('#speakingMic').onclick=()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){setMilo('Máy này chưa hỗ trợ nghe trực tiếp. Em có thể gõ câu trả lời.');return}const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.onstart=()=>setMilo(`${companionName()} đang nghe…`);recognition.onresult=event=>{input.value=event.results[0][0].transcript;setMilo(`${companionName()} nghe được: “${input.value}”`)};recognition.onerror=()=>setMilo(`${companionName()} chưa nghe rõ. Em thử nói chậm hơn nhé.`);recognition.start()};
    }
    if(state.part==='project'){
      $('#saveProject').onclick=()=>{const values=[...document.querySelectorAll('[data-project]')].map(input=>input.checked);localStorage.setItem(`milo-project-${state.grade}-${state.unit}`,JSON.stringify(values));if(values.every(Boolean))savePart('project');else setMilo('Milo đã lưu tiến độ. Hoàn thành đủ 4 bước nhé!')};
      document.querySelectorAll('[data-project]').forEach(input=>input.onchange=()=>input.closest('label').classList.toggle('checked',input.checked));
    }
    if(state.part==='test')$('#startTest').onclick=()=>startTest(unit,grade);
  }
  function startTest(unit,grade){
    const words=unit.words,others=grade.units.filter((_,index)=>index!==state.unit),otherWords=others.flatMap(item=>item.words);
    const targetQuestions=testQuestionTarget(unit),appliedTarget={2:6,3:10,4:14,5:18}[state.grade];
    const examples=words.map(word=>wordExamples(word,unit));
    const vocabQuestions=words.map((word,index)=>({
      q:index%3===0?`“${word[0]}” có nghĩa là gì?`:index%3===1?`Từ tiếng Anh của “${word[1]}” là gì?`:'Nghe Milo đọc và chọn đúng từ.',
      a:index%3===0?word[1]:word[0],
      audio:index%3===2?word[0]:undefined,
      icon:word[2],
      o:index%3===0?uniqueOptions(word[1],otherWords.map(item=>item[1])):uniqueOptions(word[0],words.map(item=>item[0]))
    }));
    const applied=Array.from({length:Math.min(appliedTarget,words.length*2)},(_,index)=>{const wordIndex=index%words.length,word=words[wordIndex],example=examples[wordIndex][index%examples[wordIndex].length];return{
      q:example.toLowerCase().includes(word[0].toLowerCase())?example.replace(new RegExp(word[0],'i'),'_____'):`Chọn từ đúng để hoàn thành câu về ${unit.title}.`,
      a:word[0],icon:word[2],o:uniqueOptions(word[0],words.map(item=>item[0]))
    }});
    const skills=[
      {q:unit.pattern[0],a:unit.pattern[1],icon:'💬',o:uniqueOptions(unit.pattern[1],others.map(item=>item.pattern[1]))},
      {q:'Đâu là câu hỏi chính của Unit?',a:unit.pattern[0],icon:'❓',o:uniqueOptions(unit.pattern[0],others.map(item=>item.pattern[0]))},
      {q:'Nghe và chọn đúng câu em vừa nghe.',a:unit.pattern[1],audio:unit.pattern[1],icon:'🎧',o:uniqueOptions(unit.pattern[1],[unit.pattern[0],...others.map(item=>item.pattern[1])])},
      {q:'Trọng tâm phát âm/ngữ âm của Unit là gì?',a:unit.phonics,icon:'🔤',o:uniqueOptions(unit.phonics,others.map(item=>item.phonics))}
    ];
    const grammarQuestions=(unit.expert?.grammar||[]).map(level=>({q:level.question,a:level.answer,icon:'🧠',o:level.options}));
    const readingText=readingPassage(unit,grade);
    const readingQuestions=[
      {q:'Ý chính phù hợp nhất với bài đọc là gì?',a:unit.title,icon:'📖',o:uniqueOptions(unit.title,others.map(item=>item.title)),reading:readingText},
      {q:`Từ “${words[0][0]}” trong Unit có nghĩa là gì?`,a:words[0][1],icon:'🔎',o:uniqueOptions(words[0][1],otherWords.map(item=>item[1])),reading:readingText}
    ];
    const sourceTerms=unit.fullKnowledge?.sourceTerms||[];
    const sourceMeanings=sourceTerms.map(item=>item.meaning).filter(meaning=>meaning&&meaning!=='CHƯA XÁC MINH');
    const sourceQuestions=sourceTerms.flatMap((item,index)=>[
      {q:`“${item.term}” có nghĩa là gì?`,a:item.meaning,icon:'📚',o:uniqueOptions(item.meaning,sourceMeanings.filter(value=>value!==item.meaning))},
      ...(index%2===0?[{q:`Từ/cụm từ tiếng Anh của “${item.meaning}” là gì?`,a:item.term,audio:item.term,icon:'🔊',o:uniqueOptions(item.term,sourceTerms.map(value=>value.term).filter(value=>value!==item.term))}]:[])
    ]);
    const pool=[...sourceQuestions,...vocabQuestions,...applied,...skills,...grammarQuestions,...readingQuestions];
    let fill=0;
    while(pool.length<targetQuestions){const word=words[fill%words.length];pool.push({q:`Chọn từ phù hợp với hình ${word[2]}.`,a:word[0],icon:word[2],o:uniqueOptions(word[0],words.map(item=>item[0]))});fill++}
    state.quiz=shuffle(pool).slice(0,targetQuestions);state.question=0;state.score=0;state.shield=3;state.combo=0;state.testAnswers=[];state.testLocked=false;$('#testIntro').classList.add('hidden');renderTestQuestion();
  }
  function testExplanation(question,value,correct){
    if(correct)return `Chính xác! “${question.a}” là đáp án phù hợp nhất với nội dung của Unit này.`;
    return `Đáp án đúng là “${question.a}”. Em hãy đọc lại câu hỏi và ghi nhớ cách dùng từ/cấu trúc này nhé.`;
  }
  function burstReward(kind='correct'){
    const layer=document.createElement('div');layer.className=`reward-burst ${kind}`;
    const symbols=kind==='correct'?['⭐','✨','🌟','💛','✦']:['💡','✨','🦊'];
    layer.innerHTML=Array.from({length:14},(_,i)=>`<span style="--i:${i};--x:${Math.round(Math.random()*180-90)}px;--y:${Math.round(-40-Math.random()*140)}px">${symbols[i%symbols.length]}</span>`).join('');
    document.body.appendChild(layer);setTimeout(()=>layer.remove(),1200);
  }
  function nextTestQuestion(){
    state.question++;
    if(state.question<state.quiz.length)renderTestQuestion();else finishTest();
  }
  function renderTestQuestion(){
    state.testLocked=false;
    const question=state.quiz[state.question];
    const total=state.quiz.length;
    const passScore=Math.ceil(total*(state.grade===2?.75:.8)),health=Math.max(0,Math.round(100-state.score/passScore*100));
    const skill=question.reading?'READING':question.audio?'LISTENING':question.icon==='🔤'?'PHONICS':question.icon==='💬'?'COMMUNICATION':question.icon==='🧠'?'GRAMMAR':'VOCABULARY';
    $('#testRunner').innerHTML=`<div class="test-runner pro-test-card"><div class="boss-battle-hud"><div><span class="hud-milo"><img src="${miloEvolutionImage()}" alt="${companionName()}"></span><b>${companionName()}</b><small>Khiên ${'🛡️'.repeat(state.shield)}${'▫️'.repeat(3-state.shield)}</small></div><strong>COMBO ×${state.combo}</strong><div><span>${bossIcons[state.unit]}</span><b>${bossNames[state.unit]}</b><small>${health}% sức mạnh</small></div><i><em style="width:${health}%"></em></i></div><div class="test-runner-track"><span style="left:${Math.max(3,state.question/total*90)}%"><img src="${miloEvolutionImage()}" alt=""></span><i style="width:${state.question/total*100}%"></i><b>🏆</b></div><div class="test-topline"><b>Câu ${state.question+1}/${total}</b><span>${state.score} câu đúng · Mục tiêu ${passScore}</span></div><div class="test-progress"><span style="width:${(state.question+1)/total*100}%"></span></div><div class="test-question"><div class="question-skill-badge">${skill}</div><div class="test-picture-world scene-${state.question%4}"><span>✦</span><span>✦</span><strong>${question.icon||'🧭'}</strong><em>🦋</em><i></i></div>${question.reading?`<div class="test-reading-passage">${esc(question.reading.replace(/READING [12][^\n]*/g,''))}</div>`:''}<h2>${esc(question.q)}</h2>${question.audio?`<button class="audio-button premium-audio" id="testAudio">🔊 Nghe lại</button>`:''}</div><div class="test-options">${question.o.map((option,index)=>`<button class="test-option" data-test-choice="${enc(option)}"><span>${String.fromCharCode(65+index)}</span>${esc(option)}</button>`).join('')}</div><div class="answer-feedback hidden" id="answerFeedback" aria-live="polite"></div></div>`;
    if(question.audio){$('#testAudio').onclick=()=>speak(question.audio);speak(question.audio)}
    document.querySelectorAll('[data-test-choice]').forEach(button=>button.onclick=()=>{
      if(state.testLocked)return;state.testLocked=true;
      const value=decodeURIComponent(button.dataset.testChoice),correct=value===question.a;
      document.querySelectorAll('[data-test-choice]').forEach(item=>item.disabled=true);
      if(correct){state.score++;state.combo++;if(state.combo%3===0)state.shield=Math.min(3,state.shield+1);recordDaily('quizCorrect');button.classList.add('correct');burstReward('correct');speak(state.combo>=3?`Amazing! Combo ${state.combo}!`:'Correct!')}
      else{state.combo=0;state.shield=Math.max(0,state.shield-1);button.classList.add('wrong');[...document.querySelectorAll('[data-test-choice]')].find(item=>decodeURIComponent(item.dataset.testChoice)===question.a)?.classList.add('correct');burstReward('hint');speak(`The correct answer is ${question.a}.`)}
      state.testAnswers.push({q:question.q,chosen:value,answer:question.a,correct});
      const feedback=$('#answerFeedback');feedback.classList.remove('hidden');feedback.classList.add(correct?'success':'needs-work');feedback.innerHTML=`<div><strong>${correct?'✓ Tuyệt vời!':'💡 Mình cùng sửa nhé'}</strong><p>${esc(testExplanation(question,value,correct))}</p></div><button class="primary-button" id="nextTest">${state.question===total-1?'Xem kết quả':'Câu tiếp theo'} →</button>`;
      $('#nextTest').onclick=nextTestQuestion;
    });
  }
  function finishTest(){
    const unit=currentUnit();
    const passedScore=state.score>=Math.ceil(state.quiz.length*(state.grade===2?.75:.8)),percent=Math.round(state.score/state.quiz.length*100);
    let completion={ok:false,reason:'Bài kiểm tra chưa đạt 80%.',missing:[]};
    if(passedScore){
      const legacyDone=new Set(doneParts());
      legacyDone.forEach(sectionId=>{if(!progression.summary(state.grade).units[String(state.unit+1)]?.sections?.[sectionId]?.completed)progression.completeSection({grade:state.grade,unitNumber:state.unit+1,sectionId,score:80,attempts:1});});
      progression.awardActivity({grade:state.grade,unitNumber:state.unit+1,sectionId:'unit-test',type:'test',itemId:'first-pass',score:percent});
      completion=progression.completeUnit({grade:state.grade,unitNumber:state.unit+1,requiredSections:requiredProgressSections(),score:percent});
      if(completion.ok){
        const first=completion.firstCompletion;
        localStorage.setItem(lessonKey(),JSON.stringify(requiredProgressSections()));
        localStorage.setItem(`milo-boss-defeated-${state.grade}-${state.unit}`,'1');
        if(first){localStorage.setItem('milo-bonus-stars',String(Number(localStorage.getItem('milo-bonus-stars')||0)+50));localStorage.setItem('milo-care-coins',String(Number(localStorage.getItem('milo-care-coins')||0)+60));}
        renderNav();updateHeader();updateRewardHud();burstReward('correct');
      }
    }
    const pass=passedScore&&completion.ok;
    const wrong=state.testAnswers.filter(item=>!item.correct).slice(0,5);
    const missingNames=(completion.missing||[]).map(id=>activeModules().find(item=>item[0]===id)?.[2]||id);
    const finalLevel=completion.progress?.level||progression.summary(state.grade).level;
    const unitMessage=pass?(state.unit===11?`Em đã hoàn thành lớp và đạt đúng <b>Lv.50</b>.`:`Em đạt mốc <b>Lv.${progression.levelTargetForUnit(state.unit+1)}</b> và mở Unit ${state.unit+2}.`):passedScore&&missingNames.length?`Bài kiểm tra đã đạt, nhưng còn ${missingNames.length} phần chưa hoàn thành: <b>${missingNames.slice(0,4).map(esc).join(' · ')}</b>.`:'Milo vẫn ở bên em. Xem lại những câu cần luyện rồi thử lại nhé.';
    $('#testRunner').innerHTML=`<div class="test-result pro-result ${pass?'victory':'practice'}"><div class="result-crown">${pass?'🏆':'🧭'}</div><span>${pass?'MISSION COMPLETE':'KEEP GOING'}</span><strong>${state.score}/${state.quiz.length}</strong><div class="result-meter"><i style="width:${percent}%"></i></div><h2>${pass?`Victory! Em đã đánh bại ${bossNames[state.unit]}.`:passedScore?'Bài kiểm tra đạt nhưng Unit chưa hoàn thành.':'Boss vẫn còn sức mạnh!'}</h2><p>${unitMessage}</p><p><b>Cấp hiện tại:</b> Lv.${finalLevel} · ${progression.summary(state.grade).xp} XP</p>${wrong.length?`<div class="review-mistakes"><b>Ôn nhanh trước khi làm lại</b>${wrong.map(item=>`<article><span>•</span><div><small>${esc(item.q)}</small><strong>${esc(item.answer)}</strong></div></article>`).join('')}</div>`:''}<div class="result-actions"><button class="secondary-button" id="retryTest">↻ Làm một đề mới</button><a class="primary-link" href="${appViewUrl('journey')}">Về Hành trình →</a></div></div>`;
    setMilo(pass?`Tuyệt vời! Em hoàn thành Unit ${state.unit+1} và đạt Level ${finalLevel}.`:passedScore&&missingNames.length?`Em đã đạt bài kiểm tra. Hãy học xong phần ${missingNames[0]} để hoàn thành Unit.`:`Em đạt ${state.score}/${state.quiz.length}. Hãy ôn những câu Milo đã đánh dấu rồi thử lại nhé.`);
    $('#retryTest').onclick=()=>{state.question=0;state.score=0;state.combo=0;state.shield=3;state.testAnswers=[];$('#testRunner').innerHTML='';$('#testIntro').classList.remove('hidden')};
  }
  $('#gradeSelect').onchange=event=>{const grade=Number(event.target.value),next=progression.summary(grade).currentUnit-1;location.href=`lesson.html?grade=${grade}&unit=${next}&from=journey`};
  $('#unitSelect').onchange=event=>{const next=Number(event.target.value),result=progression.setCurrentUnit(state.grade,next+1);if(!result.ok){event.target.value=String(state.unit);setMilo(result.reason);return;}location.href=`lesson.html?grade=${state.grade}&unit=${next}&from=journey`};
  $('#miloRead').onclick=()=>speak($('#miloMessage').textContent);
  $('#coachLevelActivity').onclick=playCoachLevelActivity;
  addEventListener('milo:progress-updated',event=>{if(Number(event.detail?.grade)===state.grade)updateHeader();});
  syncAppShellLinks();updateHeader();renderNav();renderContent();
})();
