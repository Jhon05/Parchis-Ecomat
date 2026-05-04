(()=>{
  'use strict';

  const TOPICS = {
    '12.1':'Dynamic Programming',
    '12.2':'The Euler Equation',
    '12.3':'Infinite Horizon',
    '12.4':'The Maximum Principle',
    '12.5':'More Variables'
  };
  const TOPIC_DETAILS = {
    '12.1':'Estado, control, transición y Bellman.',
    '12.2':'Ecuación de Euler y condiciones de frontera.',
    '12.3':'Horizonte infinito, descuento y Bellman estacionaria.',
    '12.4':'Hamiltoniano discreto, coestado y condición de máximo.',
    '12.5':'Estados y controles vectoriales, Jacobiano y estabilidad.'
  };

  const CATEGORIES = [
    {key:'conceptual', label:'Conceptual', icon:'C'},
    {key:'vf', label:'Verdadero/Falso', icon:'V'},
    {key:'formulacion', label:'Formulación', icon:'F'},
    {key:'calculo', label:'Cálculo', icon:'∂'},
    {key:'interpretacion', label:'Interpretación', icon:'I'},
    {key:'integrador', label:'Integrador', icon:'★'}
  ];
  const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.key,c]));
  const LEVELS = {
    nivel1:{label:'Nivel 1 · Fundamentos', categories:['conceptual','vf','interpretacion']},
    nivel2:{label:'Nivel 2 · Formulación y cálculo', categories:['conceptual','vf','formulacion','calculo','interpretacion']},
    nivel3:{label:'Nivel 3 · Reto integrador', categories:['formulacion','calculo','interpretacion','integrador']},
    todos:{label:'Todos los niveles', categories:CATEGORIES.map(c=>c.key)}
  };

  const MAIN_PATH = [
    [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
    [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
    [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14]
  ];

  const PLAYERS_INFO = [
    {key:'red', label:'Rojo', color:'#ef4444', startIndex:0, homeSlots:[[11,2],[11,4],[13,2],[13,4]], lane:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], letter:'R'},
    {key:'blue', label:'Azul', color:'#3b82f6', startIndex:13, homeSlots:[[1,1],[1,3],[3,1],[3,3]], lane:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], letter:'A'},
    {key:'green', label:'Verde', color:'#22c55e', startIndex:26, homeSlots:[[1,11],[1,13],[3,11],[3,13]], lane:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], letter:'V'},
    {key:'yellow', label:'Amarillo', color:'#f59e0b', startIndex:39, homeSlots:[[11,11],[11,13],[13,11],[13,13]], lane:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]], letter:'Y'}
  ];

  const HOME = -1;
  const FINISH_STEPS = MAIN_PATH.length + 6;

  const $ = (id)=>document.getElementById(id);
  const els = {
    clock:$('clock'), setup:$('setupScreen'), game:$('gameScreen'),
    topicsBox:$('topicsBox'), practiceLevel:$('practiceLevel'), questionFocus:$('questionFocus'), questionSeconds:$('questionSeconds'), winTokens:$('winTokens'), playerCount:$('playerCount'), fullscreenMode:$('fullscreenMode'), playersConfig:$('playersConfig'), startGameBtn:$('startGameBtn'), loadDemoBtn:$('loadDemoBtn'),
    board:$('parchisBoard'), topicsPill:$('topicsPill'), turnPill:$('turnPill'), currentPlayerBox:$('currentPlayerBox'), diceOne:$('diceOne'), diceTwo:$('diceTwo'), diceTotal:$('diceTotal'), rollBtn:$('rollBtn'), playersList:$('playersList'), gameLog:$('gameLog'), finishGameBtn:$('finishGameBtn'), newGameBtn:$('newGameBtn'),
    qModal:$('questionModal'), qMeta:$('qMeta'), qTitle:$('qTitle'), timerBadge:$('timerBadge'), qPrompt:$('qPrompt'), qAnswers:$('qAnswers'), qHint:$('qHint'), qFeedback:$('qFeedback'), hintBtn:$('hintBtn'), pauseTimerBtn:$('pauseTimerBtn'), continueBtn:$('continueBtn'),
    finalModal:$('finalModal'), finalTitle:$('finalTitle'), finalSummary:$('finalSummary'), downloadReportBtn:$('downloadReportBtn'), returnSetupBtn:$('returnSetupBtn'),
    enterScreen:$('enterScreen'), enterFullscreenBtn:$('enterFullscreenBtn'),
    boardScene:$('boardScene'), viewFrontBtn:$('viewFrontBtn'), view3DBtn:$('view3DBtn'), view360Btn:$('view360Btn'),
    fullscreenOverlay:$('fullscreenOverlay'), resumeFullscreenBtn:$('resumeFullscreenBtn')
  };

  const cells = new Map();
  let state = null;
  let activeQuestion = null;
  let timer = null;
  let timeLeft = 0;
  let timerPaused = false;
  let boardView = '3d';

  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }
  function html(s){ return String(s).replace(/[&<>\"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
  function sample(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function normalizeAnswer(value){ return String(value ?? '').trim().toLowerCase().replace(/\s+/g,'').replace(/,/g,'.').replace(/−/g,'-'); }
  function coordKey(r,c){ return `${r},${c}`; }
  function nowISO(){ return new Date().toLocaleString('es-CO',{hour12:false}); }
  function typeset(root=document.body){ if(window.MathJax && MathJax.typesetPromise){ MathJax.typesetPromise([root]).catch(()=>{}); } }
  function sectionLabel(sec){ return `${sec} · ${TOPICS[sec]}`; }
  function categoryLabel(cat){ return CATEGORY_MAP[cat]?.label || cat; }
  function currentPlayer(){ return state.players[state.current]; }
  function finishedCount(player){ return player.tokens.filter(t=>t.finished).length; }

  function setClock(){
    const span = els.clock.querySelector('span');
    if(span) span.textContent = new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  }
  setClock(); setInterval(setClock,1000);

  function initSetup(){
    els.topicsBox.innerHTML = Object.entries(TOPICS).map(([key,title],idx)=>`
      <label class="topicCheck topicCard ${idx<5?'selected':''}">
        <input type="checkbox" value="${key}" ${idx<5?'checked':''}>
        <span class="topicNumber">${key}</span>
        <span class="topicText"><strong>${title}</strong><span>${TOPIC_DETAILS[key]}</span></span>
      </label>`).join('');
    els.topicsBox.querySelectorAll('.topicCheck').forEach(card=>{
      const input = card.querySelector('input');
      card.addEventListener('click', ()=>setTimeout(()=>card.classList.toggle('selected', input.checked), 0));
      input.addEventListener('change', ()=>card.classList.toggle('selected', input.checked));
    });
    renderPlayerConfig();
    typeset(document.body);
  }

  function renderPlayerConfig(){
    const count = Number(els.playerCount.value || 2);
    const defaults = ['Jugador 1','Jugador 2','Jugador 3','Jugador 4'];
    els.playersConfig.innerHTML = PLAYERS_INFO.slice(0,count).map((p,i)=>`
      <div class="playerSetup">
        <div class="colorBadge" style="background:${p.color}">${p.letter}</div>
        <div class="field">
          <label>${p.label}</label>
          <input class="playerName" value="${defaults[i]}" maxlength="28" data-player-key="${p.key}">
        </div>
      </div>`).join('');
  }

  function selectedTopics(){
    const items = Array.from(els.topicsBox.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value);
    return items.length ? items : ['12.1'];
  }

  async function enterFullscreen(){
    const root = document.documentElement;
    if(root.requestFullscreen && !document.fullscreenElement){
      try{ await root.requestFullscreen(); }catch(e){}
    }
    if(document.fullscreenElement){
      if(els.enterScreen) hide(els.enterScreen);
      if(els.setup && els.setup.classList.contains('hidden') && (!state || els.game.classList.contains('hidden'))) show(els.setup);
      if(els.fullscreenOverlay) hide(els.fullscreenOverlay);
    }
    checkFullscreenState();
    typeset(document.body);
  }

  function requestFullscreenIfNeeded(){
    enterFullscreen();
  }

  function appActive(){
    return (els.setup && !els.setup.classList.contains('hidden')) || (els.game && !els.game.classList.contains('hidden')) || (els.finalModal && !els.finalModal.classList.contains('hidden'));
  }

  function checkFullscreenState(){
    if(!els.fullscreenOverlay) return;
    if(appActive() && !document.fullscreenElement){
      show(els.fullscreenOverlay);
    } else {
      hide(els.fullscreenOverlay);
    }
  }

  function setBoardView(view){
    boardView = view;
    if(!els.boardScene) return;
    els.boardScene.classList.remove('view-front','view-3d','view-360');
    els.boardScene.classList.add(`view-${view}`);
    [els.viewFrontBtn, els.view3DBtn, els.view360Btn].forEach(btn=>btn && btn.classList.remove('activeCtl'));
    if(view==='front' && els.viewFrontBtn) els.viewFrontBtn.classList.add('activeCtl');
    if(view==='3d' && els.view3DBtn) els.view3DBtn.classList.add('activeCtl');
    if(view==='360' && els.view360Btn) els.view360Btn.classList.add('activeCtl');
  }

  function log(message){
    if(!state) return;
    state.log.unshift({time:new Date().toLocaleTimeString('es-CO',{hour12:false}), message});
    state.log = state.log.slice(0,120);
    renderLog();
  }

  function renderLog(){
    els.gameLog.innerHTML = (state?.log || []).map(item=>`<p><strong>${item.time}</strong> · ${html(item.message)}</p>`).join('');
  }

  function startGame(){
    requestFullscreenIfNeeded();
    const count = Number(els.playerCount.value || 2);
    const names = Array.from(els.playersConfig.querySelectorAll('.playerName')).map((input,i)=>input.value.trim() || `Jugador ${i+1}`);
    const topics = selectedTopics();
    const players = PLAYERS_INFO.slice(0,count).map((info,i)=>({
      id:info.key,
      key:info.key,
      name:names[i],
      color:info.color,
      label:info.label,
      startIndex:info.startIndex,
      homeSlots:info.homeSlots,
      lane:info.lane,
      tokens:Array.from({length:4},(_,j)=>({id:`${info.key}-${j}`, index:j, steps:HOME, finished:false})),
      stats:{correct:0, wrong:0, answered:0, captures:0, moved:0, bySection:{}, byCategory:{}}
    }));

    state = {
      startedAt:nowISO(), endedAt:null,
      topics,
      level:els.practiceLevel.value,
      focus:els.questionFocus.value,
      questionSeconds:Number(els.questionSeconds.value || 60),
      winTokens:Number(els.winTokens.value || 2),
      players,
      current:0,
      phase:'roll',
      turnNumber:1,
      dice:{d1:null,d2:null,total:null,isDouble:false},
      selectableTokenIds:[],
      pendingMove:null,
      log:[],
      audit:[],
      usedCards:new Set(),
      winner:null,
      annulled:false
    };

    if(els.enterScreen) hide(els.enterScreen);
    hide(els.setup); show(els.game); hide(els.finalModal);
    setBoardView('3d');
    buildBoard();
    renderAll();
    log('Partida iniciada. Lanza los dados para comenzar.');
  }

  function buildBoard(){
    cells.clear();
    els.board.innerHTML = '';
    const mainMap = new Map(MAIN_PATH.map((xy,i)=>[coordKey(xy[0],xy[1]), i]));
    const laneMap = new Map();
    for(const p of PLAYERS_INFO){ p.lane.forEach((xy,i)=>laneMap.set(coordKey(xy[0],xy[1]), {player:p.key, i})); }

    for(let r=0;r<15;r++){
      for(let c=0;c<15;c++){
        const cell = document.createElement('div');
        cell.className='cell';
        const k = coordKey(r,c);
        const mainIndex = mainMap.get(k);
        const lane = laneMap.get(k);

        if(isHomeCell(r,c,'red')) cell.classList.add('home','red');
        else if(isHomeCell(r,c,'blue')) cell.classList.add('home','blue');
        else if(isHomeCell(r,c,'green')) cell.classList.add('home','green');
        else if(isHomeCell(r,c,'yellow')) cell.classList.add('home','yellow');

        if(mainIndex !== undefined){
          const cat = CATEGORIES[mainIndex % CATEGORIES.length].key;
          cell.className = `cell path category-${cat}`;
          cell.dataset.category = cat;
          cell.innerHTML = `<span>${CATEGORY_MAP[cat].icon}</span>`;
        }
        if(lane){
          const laneCat = CATEGORIES[lane.i % CATEGORIES.length].key;
          cell.className = `cell path lane ${lane.player} category-${laneCat}`;
          cell.dataset.category = laneCat;
          cell.innerHTML = `<span>${CATEGORY_MAP[laneCat].icon}</span>`;
        }
        if(r===7 && c===7){
          cell.className='cell center';
          cell.dataset.category='integrador';
          cell.innerHTML='<span>🏁</span>';
        }
        const stack = document.createElement('div');
        stack.className='tokenStack';
        cell.appendChild(stack);
        els.board.appendChild(cell);
        cells.set(k,{cell,stack});
      }
    }
  }

  function isHomeCell(r,c,key){
    if(key==='red') return r>=9 && r<=14 && c>=0 && c<=5;
    if(key==='blue') return r>=0 && r<=5 && c>=0 && c<=5;
    if(key==='green') return r>=0 && r<=5 && c>=9 && c<=14;
    if(key==='yellow') return r>=9 && r<=14 && c>=9 && c<=14;
    return false;
  }

  function tokenCoord(player, token){
    if(token.finished) return [7,7];
    if(token.steps === HOME) return player.homeSlots[token.index];
    if(token.steps < MAIN_PATH.length){
      const globalIndex = (player.startIndex + token.steps) % MAIN_PATH.length;
      return MAIN_PATH[globalIndex];
    }
    const laneIndex = token.steps - MAIN_PATH.length;
    if(laneIndex >= 0 && laneIndex < player.lane.length) return player.lane[laneIndex];
    return [7,7];
  }

  function tokenCategory(player, token, steps){
    if(steps >= FINISH_STEPS) return 'integrador';
    if(steps < MAIN_PATH.length){
      const globalIndex = (player.startIndex + steps) % MAIN_PATH.length;
      return CATEGORIES[globalIndex % CATEGORIES.length].key;
    }
    const laneIndex = steps - MAIN_PATH.length;
    return CATEGORIES[laneIndex % CATEGORIES.length].key;
  }

  function movableTokens(player, total){
    return player.tokens.filter(t=>!t.finished && t.steps !== HOME && t.steps + total <= FINISH_STEPS);
  }

  function renderAll(){
    renderBoardTokens();
    renderTopInfo();
    renderPlayersList();
    renderLog();
  }

  function renderBoardTokens(){
    for(const {stack} of cells.values()) stack.innerHTML='';
    const selectable = new Set(state?.selectableTokenIds || []);
    const byCell = new Map();
    for(const player of state.players){
      for(const token of player.tokens){
        const [r,c] = tokenCoord(player, token);
        const key = coordKey(r,c);
        if(!byCell.has(key)) byCell.set(key, []);
        byCell.get(key).push({player, token});
      }
    }
    const avatars = {red:['🦁','🐯','🦊','🐲'], blue:['🦋','🐬','🦕','🦅'], green:['🐸','🐢','🐍','🦎'], yellow:['🐱','🐻','🦒','🦄']};
    for(const [key, entries] of byCell.entries()){
      const holder = cells.get(key);
      if(!holder) continue;
      const visible = entries.slice(0,4);
      visible.forEach(({player, token})=>{
        const btn = document.createElement('button');
        btn.className = 'token';
        btn.style.background = `radial-gradient(circle at 30% 25%, rgba(255,255,255,.95), ${player.color})`;
        btn.innerHTML = `<span class="tokenEmoji">${avatars[player.id]?.[token.index] || (token.index+1)}</span>`;
        btn.title = `${player.name} · ficha ${token.index+1}`;
        if(token.finished) btn.classList.add('finished');
        if(selectable.has(token.id)){
          btn.classList.add('selectable');
          btn.addEventListener('click', ()=>selectTokenForMove(player.id, token.id));
        }
        holder.stack.appendChild(btn);
      });
      if(entries.length > 4){
        const badge = document.createElement('div');
        badge.className = 'tokenOverflow';
        badge.textContent = `+${entries.length-4}`;
        holder.stack.appendChild(badge);
      }
    }
  }

  function renderTopInfo(){
    const player = currentPlayer();
    els.topicsPill.textContent = `${state.topics.join(', ')} · ${LEVELS[state.level].label}`;
    els.turnPill.textContent = `Turno ${state.turnNumber} · ${player.name}`;
    const diceText = state.dice.total ? `Dados: ${state.dice.d1} y ${state.dice.d2} (total ${state.dice.total})` : 'Aún no se ha lanzado';
    const phaseText = state.phase === 'roll' ? 'Lanza los dados.' : state.phase === 'select' ? 'Selecciona una ficha para intentar moverla.' : 'Resuelve la tarjeta activa.';
    els.currentPlayerBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="colorBadge" style="width:58px;height:58px;background:${player.color};">${player.name.slice(0,1).toUpperCase()}</div>
        <div>
          <div style="font-weight:900;font-size:18px;">${html(player.name)}</div>
          <div class="note">${diceText}</div>
          <div class="note">${phaseText}</div>
        </div>
      </div>`;

    els.rollBtn.disabled = state.phase !== 'roll';
    els.diceOne.textContent = state.dice.d1 ?? '?';
    els.diceTwo.textContent = state.dice.d2 ?? '?';
    els.diceTotal.textContent = state.dice.total ? `Total: ${state.dice.total}${state.dice.isDouble ? ' · Par' : ''}` : 'Total: —';
  }

  function renderPlayersList(){
    els.playersList.innerHTML = state.players.map((p,idx)=>{
      const active = idx===state.current ? 'active' : '';
      const grade = gradeFor(p).toFixed(1);
      return `
        <article class="playerCard ${active}">
          <div class="playerCardHead">
            <div>
              <div style="font-weight:1000;display:flex;align-items:center;gap:8px;"><span class="colorBadge" style="width:30px;height:30px;border-radius:50%;background:${p.color};font-size:12px;">${p.name.slice(0,1).toUpperCase()}</span> ${html(p.name)}</div>
              <div class="miniScore">Aciertos: ${p.stats.correct}/${p.stats.answered} · Capturas: ${p.stats.captures} · Nota: ${grade}/5.0</div>
            </div>
            <div class="miniScore">Meta: ${finishedCount(p)}/${state.winTokens}</div>
          </div>
          <div class="progressDots">${p.tokens.map(t=>`<span class="dot ${t.finished?'on':''}" style="background:${t.finished ? p.color : 'rgba(255,255,255,.08)'}"></span>`).join('')}</div>
        </article>`;
    }).join('');
  }

  function gradeFor(player){
    return Math.min(5, player.stats.answered ? (5*player.stats.correct/player.stats.answered) : 0);
  }

  function rollDice(){
    if(state.phase !== 'roll') return;
    els.diceOne.classList.add('rolling');
    els.diceTwo.classList.add('rolling');
    setTimeout(()=>{
      els.diceOne.classList.remove('rolling');
      els.diceTwo.classList.remove('rolling');
      const d1 = randInt(1,6), d2 = randInt(1,6);
      state.dice = {d1,d2,total:d1+d2,isDouble:d1===d2};
      state.selectableTokenIds = [];
      state.pendingMove = null;

      const player = currentPlayer();
      let released = 0;
      if(d1===d2){
        const homeTokens = player.tokens.filter(t=>t.steps===HOME && !t.finished);
        const releaseCount = (d1===1 || d1===6) ? 4 : 2;
        const take = Math.min(releaseCount, homeTokens.length);
        for(let i=0;i<take;i++){
          homeTokens[i].steps = 0;
          released++;
          captureOpponentsAt(player, homeTokens[i]);
        }
        if(released>0){
          log(`${player.name} sacó par ${d1}-${d2} y puso ${released} ficha(s) en juego.`);
        } else {
          log(`${player.name} sacó par ${d1}-${d2}, pero no tenía fichas en casa para sacar.`);
        }
      } else {
        log(`${player.name} lanzó ${d1} y ${d2}.`);
      }

      const movable = movableTokens(player, d1+d2);
      state.selectableTokenIds = movable.map(t=>t.id);
      state.phase = movable.length ? 'select' : 'roll';
      renderAll();

      if(!movable.length){
        log(`${player.name} no tiene movimientos válidos con ${d1+d2}.`);
        setTimeout(nextTurn, 900);
      } else {
        log(`${player.name} debe elegir una ficha para intentar mover ${d1+d2} casillas.`);
      }
    }, 500);
  }

  function selectTokenForMove(playerId, tokenId){
    if(state.phase !== 'select') return;
    const player = currentPlayer();
    if(player.id !== playerId) return;
    const token = player.tokens.find(t=>t.id===tokenId);
    if(!token) return;

    const destination = token.steps + state.dice.total;
    if(destination > FINISH_STEPS) return;
    const category = tokenCategory(player, token, destination);
    const allowed = LEVELS[state.level].categories;
    const finalCategory = allowed.includes(category) ? category : sample(allowed);
    const section = sample(state.topics);

    state.pendingMove = { playerId, tokenId, from:token.steps, to:destination, section, category:finalCategory };
    state.phase = 'question';
    state.selectableTokenIds = [];
    renderAll();
    openQuestion(generateQuestion(section, finalCategory));
  }

  function openQuestion(question){
    activeQuestion = question;
    els.qMeta.textContent = `${sectionLabel(question.section)} · ${categoryLabel(question.category)}`;
    els.qTitle.textContent = `Tarjeta · ${question.title}`;
    els.qPrompt.innerHTML = `<div class="bookLabel">Enunciado</div><div class="bookQuestionText">${question.prompt}</div>`;
    els.qHint.innerHTML = question.hint ? question.hint : '';
    question.hint ? show(els.qHint) : hide(els.qHint);
    els.qHint.classList.add('hidden');
    els.qFeedback.className = 'feedback hidden';
    els.qFeedback.innerHTML = '';
    els.continueBtn.classList.add('hidden');
    renderAnswerUI(question);
    show(els.qModal);
    const allowPause = question.category === 'calculo';
    timerPaused = false;
    if(allowPause){ show(els.pauseTimerBtn); els.pauseTimerBtn.textContent = 'Detener tiempo'; }
    else hide(els.pauseTimerBtn);
    startTimer(state.questionSeconds);
    typeset(els.qModal);
  }

  function renderAnswerUI(question){
    els.qAnswers.innerHTML = '';
    if(question.interaction === 'choice'){
      question.options.forEach((opt,idx)=>{
        const btn = document.createElement('button');
        btn.className='answerBtn';
        btn.innerHTML = `<strong>${String.fromCharCode(65+idx)}.</strong> ${opt}`;
        btn.addEventListener('click', ()=>answerQuestion(idx===question.correctIndex, opt));
        els.qAnswers.appendChild(btn);
      });
    } else if(question.interaction === 'vf'){
      const row = document.createElement('div');
      row.className = 'vfRow';
      row.innerHTML = `<div>Selecciona si la afirmación es verdadera o falsa.</div>`;
      const buttons = document.createElement('div');
      buttons.className='vfButtons';
      const b1 = document.createElement('button'); b1.textContent='Verdadero'; b1.addEventListener('click', ()=>answerQuestion(question.answer===true, 'Verdadero'));
      const b2 = document.createElement('button'); b2.textContent='Falso'; b2.addEventListener('click', ()=>answerQuestion(question.answer===false, 'Falso'));
      buttons.appendChild(b1); buttons.appendChild(b2); row.appendChild(buttons);
      els.qAnswers.appendChild(row);
    } else if(question.interaction === 'short'){
      const row = document.createElement('div');
      row.className='shortAnswer';
      row.innerHTML = `<input id="shortInput" inputmode="numeric" placeholder="Escribe tu respuesta"><button class="submitBtn" id="shortSubmit">Verificar</button>`;
      els.qAnswers.appendChild(row);
      const input = row.querySelector('#shortInput');
      const btn = row.querySelector('#shortSubmit');
      const verify = ()=>answerQuestion(normalizeAnswer(input.value)===normalizeAnswer(question.answer), input.value);
      btn.addEventListener('click', verify);
      input.addEventListener('keydown', ev=>{ if(ev.key==='Enter') verify(); });
      setTimeout(()=>input.focus(),50);
    } else if(question.interaction === 'multi'){
      const list = document.createElement('div');
      list.className = 'multiList';
      question.options.forEach((opt,idx)=>{
        const row = document.createElement('label');
        row.className='checkRow';
        row.innerHTML = `<span>${opt}</span><input type="checkbox" value="${idx}" aria-label="Seleccionar opción ${idx+1}">`;
        const input = row.querySelector('input');
        const sync = ()=> row.classList.toggle('checked', input.checked);
        input.addEventListener('change', sync);
        row.addEventListener('keydown', (ev)=>{
          if(ev.key === 'Enter' || ev.key === ' '){
            ev.preventDefault();
            input.checked = !input.checked;
            sync();
          }
        });
        row.tabIndex = 0;
        sync();
        list.appendChild(row);
      });
      const btn = document.createElement('button');
      btn.className='submitBtn';
      btn.textContent='Verificar selección';
      btn.addEventListener('click', ()=>{
        const checked = Array.from(list.querySelectorAll('input:checked')).map(x=>Number(x.value)).sort((a,b)=>a-b).join(',');
        const answer = [...question.correctIndices].sort((a,b)=>a-b).join(',');
        answerQuestion(checked===answer, checked || '(vacío)');
      });
      els.qAnswers.appendChild(list);
      els.qAnswers.appendChild(btn);
    }
  }

  function startTimer(seconds){
    stopTimer();
    timeLeft = seconds;
    els.timerBadge.textContent = String(timeLeft);
    timer = setInterval(()=>{
      if(timerPaused) return;
      timeLeft -= 1;
      els.timerBadge.textContent = String(Math.max(0,timeLeft));
      if(timeLeft <= 0){
        stopTimer();
        answerQuestion(false, 'sin respuesta', true);
      }
    },1000);
  }

  function stopTimer(){
    if(timer){ clearInterval(timer); timer = null; }
  }

  function toggleTimerPause(){
    if(!activeQuestion || activeQuestion.category !== 'calculo') return;
    timerPaused = !timerPaused;
    els.pauseTimerBtn.textContent = timerPaused ? 'Reanudar tiempo' : 'Detener tiempo';
  }

  function answerQuestion(correct, given, expired=false){
    if(!activeQuestion) return;
    stopTimer();
    const q = activeQuestion;
    activeQuestion = null;
    Array.from(els.qAnswers.querySelectorAll('button,input')).forEach(el=>el.disabled=true);
    const player = currentPlayer();
    player.stats.answered += 1;
    player.stats[correct ? 'correct' : 'wrong'] += 1;
    player.stats.bySection[q.section] = player.stats.bySection[q.section] || {correct:0,total:0};
    player.stats.byCategory[q.category] = player.stats.byCategory[q.category] || {correct:0,total:0};
    player.stats.bySection[q.section].total += 1;
    player.stats.byCategory[q.category].total += 1;
    if(correct){
      player.stats.bySection[q.section].correct += 1;
      player.stats.byCategory[q.category].correct += 1;
    }

    state.audit.push({
      time:nowISO(),
      player:player.name,
      section:q.section,
      category:q.category,
      prompt:stripHtml(q.prompt).slice(0,220),
      given:String(given),
      correct,
      expired
    });

    els.qFeedback.className = `feedback ${correct ? 'correct' : 'wrong'}`;
    const rightText = q.solutionText ? q.solutionText : (q.interaction === 'short' ? `Respuesta correcta: <strong>${html(q.answer)}</strong>.` : 'Se aplicó la clave de respuestas del juego.');
    els.qFeedback.innerHTML = `${correct ? '<strong>¡Correcto!</strong>' : '<strong>Respuesta incorrecta.</strong>'}${expired ? ' Tiempo agotado.' : ''}<br>${rightText}<br>${q.feedback || ''}`;
    show(els.qFeedback);
    show(els.continueBtn);

    state.pendingMove.resultCorrect = correct;
    log(`${player.name} respondió ${correct ? 'correctamente' : 'incorrectamente'} una tarjeta de ${categoryLabel(q.category)} (${q.section}).`);
    typeset(els.qFeedback);
  }

  function continueAfterQuestion(){
    hide(els.qModal);
    const move = state.pendingMove;
    const player = currentPlayer();
    if(move && move.resultCorrect){
      const token = player.tokens.find(t=>t.id===move.tokenId);
      token.steps = move.to;
      if(move.to >= FINISH_STEPS){
        token.finished = true;
        log(`${player.name} llevó una ficha a la meta.`);
      } else {
        captureOpponentsAt(player, token);
        log(`${player.name} avanzó una ficha ${state.dice.total} casillas.`);
      }
      player.stats.moved += 1;
      if(finishedCount(player) >= state.winTokens){
        endGame(true, `${player.name} ganó la partida.`);
        return;
      }
    } else {
      log(`${player.name} no avanzó porque no respondió bien la tarjeta.`);
    }
    state.pendingMove = null;
    nextTurn();
  }

  function captureOpponentsAt(player, token){
    if(token.finished || token.steps === HOME) return;
    const myCoord = tokenCoord(player, token).join(',');
    let captures = 0;
    state.players.forEach(other=>{
      if(other.id === player.id) return;
      other.tokens.forEach(t=>{
        if(t.finished || t.steps === HOME) return;
        if(tokenCoord(other,t).join(',') === myCoord){
          t.steps = HOME;
          captures += 1;
        }
      });
    });
    if(captures>0){
      player.stats.captures += captures;
      log(`${player.name} capturó ${captures} ficha(s) rival(es).`);
    }
  }

  function nextTurn(){
    state.current = (state.current + 1) % state.players.length;
    state.phase = 'roll';
    state.turnNumber += 1;
    state.dice = {d1:null,d2:null,total:null,isDouble:false};
    state.selectableTokenIds = [];
    state.pendingMove = null;
    renderAll();
  }

  function endGame(hasWinner, message){
    state.endedAt = nowISO();
    state.winner = hasWinner ? currentPlayer().name : null;
    state.phase = 'ended';
    renderAll();
    buildFinalSummary(message);
    show(els.finalModal);
    if(message) log(message);
  }

  function buildFinalSummary(message){
    const rows = state.players.map(p=>`<tr><td>${html(p.name)}</td><td>${finishedCount(p)}</td><td>${p.stats.correct}/${p.stats.answered}</td><td>${gradeFor(p).toFixed(1)}</td><td>${p.stats.captures}</td><td>${p.stats.moved}</td></tr>`).join('');
    els.finalTitle.textContent = state.winner ? `Ganó ${state.winner}` : 'Partida finalizada';
    els.finalSummary.innerHTML = `
      <p>${html(message || 'La partida terminó.')}</p>
      <table class="summaryTable">
        <thead><tr><th>Jugador</th><th>Fichas meta</th><th>Aciertos</th><th>Nota / 5.0</th><th>Capturas</th><th>Movimientos válidos</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="note">Se recomienda descargar el reporte PDF para revisar desempeño por tema, categoría y tarjetas resueltas.</p>`;
  }

  function stripHtml(s){
    const div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent || div.innerText || '';
  }

  function generateQuestion(section, category){
    const generators = {
      conceptual: makeConceptualQuestion,
      vf: makeVFQuestion,
      formulacion: makeFormulationQuestion,
      calculo: makeCalculationQuestion,
      interpretacion: makeInterpretationQuestion,
      integrador: makeIntegratorQuestion
    };
    return generators[category](section, state.focus);
  }

  function choiceQuestion(section, category, title, prompt, correct, distractors, feedback, hint){
    const options = shuffle([correct, ...distractors]);
    return {section, category, title, prompt, options, correctIndex:options.indexOf(correct), interaction:'choice', feedback, hint, solutionText:`<span class="bookSolution">Respuesta correcta:</span> <strong>${correct}</strong>.`};
  }

  function shortQuestion(section, category, title, prompt, answer, feedback, hint){
    return {section, category, title, prompt, interaction:'short', answer:String(answer), feedback, hint, solutionText:`<span class="bookSolution">Respuesta correcta:</span> \( ${answer} \).`};
  }

  function vfQuestion(section, prompt, answer, feedback, hint){
    return {section, category:'vf', title:'Verdadero o falso', prompt, interaction:'vf', answer, feedback, hint, solutionText:`<span class="bookSolution">Valor de verdad:</span> <strong>${answer ? 'verdadera' : 'falsa'}</strong>.`};
  }

  function makeConceptualQuestion(section){
    const bank = {
      '12.1':()=>choiceQuestion(section,'conceptual','Concepto básico',
        'En programación dinámica, la <strong>variable de estado</strong> es la que:',
        'resume la información relevante del pasado para decidir hoy y proyectar el futuro',
        ['siempre coincide con el control óptimo','solo aparece en el último periodo','se puede eliminar sin afectar el problema'],
        'La variable de estado condensa la información necesaria para aplicar Bellman.',
        'Piensa qué objeto conecta presente y futuro.'),
      '12.2':()=>choiceQuestion(section,'conceptual','Idea central de Euler',
        'La ecuación de Euler discreta aparece al:',
        'igualar el efecto marginal de mover una unidad entre periodos consecutivos',
        ['eliminar la restricción dinámica','reemplazar Bellman por una derivada parcial cualquiera','forzar que el control sea siempre nulo'],
        'Euler compara beneficios marginales intertemporales.',
        'La palabra clave es “intertemporal”.'),
      '12.3':()=>choiceQuestion(section,'conceptual','Horizonte infinito',
        'En horizonte infinito con factor de descuento \\(\\beta\\in(0,1)\\), Bellman estacionaria significa que:',
        'la forma de la función de valor no depende del tiempo',
        ['el descuento deja de existir','la restricción dinámica se vuelve lineal','el problema se transforma en uno de un solo periodo'],
        'En estado estacionario, la ecuación funcional es la misma en todos los periodos.',
        'Piensa en “misma regla para todo t”.'),
      '12.4':()=>choiceQuestion(section,'conceptual','Principio del máximo',
        'En el principio del máximo discreto, el coestado se interpreta como:',
        'el precio sombra del estado',
        ['la varianza del control','la probabilidad de transición','una constante sin interpretación'],
        'El coestado mide el valor marginal del estado en el objetivo.',
        'Palabra clave: “precio sombra”.'),
      '12.5':()=>choiceQuestion(section,'conceptual','Modelo con varias variables',
        'Si el estado es vectorial, entonces la dinámica suele escribirse como:',
        '\\(x_{t+1}=g(x_t,u_t)\\) con \\(x_t\\in\\mathbb{R}^n\\)',
        ['\\(x_t=g(u_t)\\) sin dependencia temporal','\\(u_{t+1}=x_t+u_t\\) obligatoriamente escalar','\\(V_t=x_t+u_t\\) como única ecuación del modelo'],
        'Con varias variables, el estado y el control pueden ser vectores.',
        'Fíjate en la dimensión del estado.')
    };
    return (bank[section] || bank['12.1'])();
  }

  function makeVFQuestion(section){
    const bank = {
      '12.1':()=>vfQuestion(section,
        'Si una política es óptima desde hoy, entonces su continuación también debe ser óptima desde cualquier estado futuro alcanzado.',
        true,
        'Eso es precisamente el principio de optimalidad de Bellman.',
        'Piensa en subproblemas óptimos.'),
      '12.2':()=>vfQuestion(section,
        'La ecuación de Euler solo puede escribirse cuando no existe restricción dinámica.',
        false,
        'Al contrario: Euler se obtiene precisamente considerando cómo la restricción conecta periodos.',
        'La restricción intertemporal es clave.'),
      '12.3':()=>vfQuestion(section,
        'Si \\(\\beta\\) disminuye, las utilidades futuras pesan relativamente menos en el valor presente.',
        true,
        'Un menor descuento reduce el peso de los términos futuros.',
        'Compara \\(\\beta^t\\) cuando \\(\\beta\\) es menor.'),
      '12.4':()=>vfQuestion(section,
        'En un problema interior, una condición típica es \\(H_u=0\\).',
        true,
        'La derivada del Hamiltoniano respecto al control se anula en el óptimo interior.',
        'Recuerda la condición de primer orden.'),
      '12.5':()=>vfQuestion(section,
        'En un sistema con dos estados, nunca puede haber más de un coestado.',
        false,
        'Normalmente hay un coestado por cada ecuación de estado.',
        'Relaciona dimensión del estado y del vector coestado.')
    };
    return (bank[section] || bank['12.1'])();
  }

  function makeFormulationQuestion(section){
    if(section==='12.1'){
      const x = randInt(1,4), target = x + randInt(2,6);
      return shortQuestion(section,'formulacion','Formulación rápida',
        `Sea la dinámica \\(x_{t+1}=x_t+u_t\\) con \\(x_t=${x}\\). Si deseas que el siguiente estado sea \\(${target}\\), ¿qué valor entero debe tomar \\(u_t\\)?`,
        target-x,
        'Se despeja directamente de la ecuación de transición.',
        'Usa \\(u_t=x_{t+1}-x_t\\).');
    }
    if(section==='12.2'){
      return choiceQuestion(section,'formulacion','Formulación de Euler',
        'Si una suma objetivo contiene términos en \\(x_t\\) y \\(x_{t+1}\\), la ecuación de Euler se construye diferenciando respecto a:',
        'la variable interior que aparece en dos periodos consecutivos',
        ['solo la utilidad del último periodo','exclusivamente el estado inicial','una constante de descuento'],
        'Euler surge porque una misma variable interior afecta dos términos vecinos.',
        'Busca la variable “compartida”.');
    }
    if(section==='12.3'){
      const beta = sample([0.5,0.8,0.9]);
      return choiceQuestion(section,'formulacion','Bellman estacionaria',
        `¿Cuál expresión representa correctamente un problema de horizonte infinito con descuento \\(\\beta=${beta}\\)?`,
        `\\(V(x)=\\max_u\\{f(x,u)+${beta}V(g(x,u))\\}\\)`,
        ['\\(V_t(x)=f(x,u)+V_{t+1}(x)\\) sin maximización','\\(V(x)=f(x,u)+g(x,u)\\)','\\(V(x)=\\beta+u\\)'],
        'Bellman estacionaria mantiene la misma función de valor en todos los periodos.',
        'Debe aparecer maximización, recompensa y valor futuro descontado.');
    }
    if(section==='12.4'){
      return choiceQuestion(section,'formulacion','Hamiltoniano',
        'Si la recompensa corriente es \\(f(x_t,u_t)\\) y la dinámica es \\(x_{t+1}=g(x_t,u_t)\\), el Hamiltoniano discreto se escribe como:',
        '\\(H_t=f(x_t,u_t)+p_{t+1}g(x_t,u_t)\\)',
        ['\\(H_t=f(x_t,u_t)-g(x_t,u_t)\\)','\\(H_t=p_t+u_t\\)','\\(H_t=x_tu_t\\) sin coestado'],
        'El coestado multiplica la dinámica del estado.',
        'Piensa en “utilidad + precio sombra × transición”.');
    }
    const a = randInt(1,3), b = randInt(1,4), u = randInt(1,4), x = randInt(1,3), y = randInt(2,5), vx = a*x + u, vy = y + b*u;
    return shortQuestion(section,'formulacion','Sistema vectorial',
      `Considera el sistema \\(x_{t+1}=x_t+u_t\\), \\(y_{t+1}=y_t+2u_t\\). Si \\((x_t,y_t)=(${x},${y})\\) y \\(u_t=${u}\\), ¿cuál es el valor entero de \\(y_{t+1}\\)?`,
      vy,
      'Solo se reemplaza el control dado en la segunda ecuación.',
      'Usa la ecuación de actualización de \\(y\\).');
  }

  function makeCalculationQuestion(section){
    if(section==='12.1'){
      const x = randInt(1,5), target = x + randInt(2,7);
      return shortQuestion(section,'calculo','Cálculo de control óptimo',
        `Sea \\(x_{t+1}=x_t+u_t\\), con \\(x_t=${x}\\). El objetivo es minimizar \\((x_{t+1}-${target})^2\\) sobre controles enteros. ¿Cuál es el control óptimo \\(u_t\\)?`,
        target-x,
        'La distancia al objetivo es mínima cuando el siguiente estado coincide exactamente con el objetivo.',
        'Primero fuerza \\(x_{t+1}=${target}\\).');
    }
    if(section==='12.2'){
      const c = randInt(2,6);
      return shortQuestion(section,'calculo','Ecuación de Euler sencilla',
        `Supón que una condición de Euler lleva a \\(2u_t=${2*c}\\). Si el control debe ser entero, ¿cuál es el valor óptimo de \\(u_t\\)?`,
        c,
        'La condición de primer orden se resuelve directamente.',
        'Despeja la variable de la igualdad.');
    }
    if(section==='12.3'){
      const a = sample([0,1,2]), b = randInt(2,5), x0 = randInt(1,4), target = a*x0 + b;
      return shortQuestion(section,'calculo','Estado óptimo de siguiente periodo',
        `Con dinámica \\(x_{t+1}=${a}x_t+u_t\\), estado actual \\(x_t=${x0}\\) y objetivo de hacer \\(u_t=${b}\\), ¿cuál es el valor entero de \\(x_{t+1}\\)?`,
        target,
        'Se sustituye el estado actual y el control dado en la dinámica.',
        'Evalúa la ecuación de transición.');
    }
    if(section==='12.4'){
      const lambda = sample([2,4,6,8]);
      return shortQuestion(section,'calculo','Control por principio del máximo',
        `Si el Hamiltoniano es \\(H=-u_t^2+${lambda}u_t\\), la condición interior \\(H_u=0\\) da el control óptimo. ¿Cuál es el valor entero de \\(u_t^*\\)?`,
        lambda/2,
        'Deriva: \\(H_u=-2u_t+\\lambda\\).',
        'Iguala la derivada a cero.');
    }
    const x = randInt(1,4), y = randInt(1,4), u = randInt(1,4);
    return shortQuestion(section,'calculo','Cálculo en sistema con dos estados',
      `Sea el sistema \\(x_{t+1}=x_t+u_t\\), \\(y_{t+1}=y_t-u_t\\). Si \\((x_t,y_t)=(${x},${y})\\) y el control óptimo es \\(u_t=${u}\\), ¿cuál es el valor entero de \\(x_{t+1}+y_{t+1}\\)?`,
      (x+u)+(y-u),
      'El control se cancela en la suma final.',
      'Calcula ambos estados y luego suma.');
  }

  function makeInterpretationQuestion(section){
    const bank = {
      '12.1':()=>choiceQuestion(section,'interpretacion','Interpretación económica',
        'Si al aumentar el estado hoy crece el valor óptimo futuro, una lectura correcta es que:',
        'el estado es un recurso valioso para decisiones posteriores',
        ['el estado es irrelevante','la función de valor debe ser constante','el control desaparece del problema'],
        'Mayor valor futuro indica que el estado mejora las oportunidades.',
        'Piensa en capital, inventario o riqueza.'),
      '12.2':()=>choiceQuestion(section,'interpretacion','Lectura de Euler',
        'Cuando Euler se cumple con igualdad, significa que:',
        'ya no conviene trasladar marginalmente recursos entre periodos',
        ['el descuento es igual a cero','el estado es constante para todo tiempo','la dinámica deja de importar'],
        'La condición expresa equilibrio marginal entre periodos vecinos.',
        'Mover una unidad no mejora el objetivo.'),
      '12.3':()=>choiceQuestion(section,'interpretacion','Descuento',
        'Si \\(\\beta\\) está cerca de 1, el agente:',
        'da relativamente más importancia al futuro',
        ['ignora el futuro por completo','convierte el problema en estático','necesariamente elige control cero'],
        'Un descuento más alto pesa más el futuro.',
        'Compara la pérdida de peso por periodo.'),
      '12.4':()=>choiceQuestion(section,'interpretacion','Coestado alto',
        'Si el coestado del capital es alto y positivo, una interpretación razonable es:',
        'una unidad adicional del estado tiene gran valor marginal',
        ['el capital sobra y debe eliminarse','la condición de máximo no aplica','el control no afecta nada'],
        'El coestado es el precio sombra del estado.',
        '“Valor marginal” es la idea clave.'),
      '12.5':()=>choiceQuestion(section,'interpretacion','Jacobiano y estabilidad',
        'En un análisis local, si el Jacobiano tiene autovalores de módulo pequeño, se sugiere que:',
        'trayectorias cercanas pueden permanecer próximas al equilibrio',
        ['el sistema es siempre explosivo','no existe equilibrio','el control debe ser entero'],
        'La estabilidad local se relaciona con autovalores de la linealización.',
        'La pregunta es cualitativa, no exacta.')
    };
    return (bank[section] || bank['12.1'])();
  }

  function makeIntegratorQuestion(section){
    const optionsBySection = {
      '12.1':['Identificar estado y control.','Escribir la dinámica.','Omitir la factibilidad.','Aplicar Bellman.'],
      '12.2':['Identificar la variable interior común.','Comparar términos de periodos vecinos.','Eliminar toda restricción.','Revisar condición terminal.'],
      '12.3':['Proponer una forma para \\(V\\).','Sustituir en Bellman.','Ignorar el descuento.','Verificar la política.'],
      '12.4':['Construir el Hamiltoniano.','Imponer \\(H_u=0\\) si el óptimo es interior.','Ignorar el coestado.','Usar la ecuación adjunta.'],
      '12.5':['Revisar dimensiones del estado.','Calcular un Jacobiano local.','Usar un solo coestado para todo.','Interpretar estabilidad local.']
    };
    const correct = {
      '12.1':[0,1,3],
      '12.2':[0,1,3],
      '12.3':[0,1,3],
      '12.4':[0,1,3],
      '12.5':[0,1,3]
    };
    return {
      section,
      category:'integrador',
      title:'Tarjeta integradora',
      prompt:`Selecciona todas las acciones correctas para resolver con rigor un problema de <strong>${sectionLabel(section)}</strong>.`,
      interaction:'multi',
      options:optionsBySection[section] || optionsBySection['12.1'],
      correctIndices:correct[section] || correct['12.1'],
      hint:'Puede haber más de una respuesta correcta.',
      feedback:'En preguntas integradoras se espera reconocer el flujo correcto de modelación y solución.',
      solutionText:'Las opciones correctas corresponden a los pasos esenciales del método.'
    };
  }

  function downloadReport(){
    if(!state) return;
    const jsPDF = window.jspdf?.jsPDF;
    if(!jsPDF){ return; }
    const doc = new jsPDF({unit:'pt',format:'letter'});
    const margin = 42;
    doc.setFillColor(16,24,39); doc.rect(0,0,612,92,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('Reporte de Parchís ECOMAT · Programación Dinámica', margin, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`Inicio: ${state.startedAt} · Fin: ${state.endedAt || nowISO()} · Temas: ${state.topics.join(', ')}`, margin, 60);
    let y = 118;
    doc.setTextColor(20,30,48);
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(state.winner ? `Ganador: ${state.winner}` : 'Partida finalizada', margin, y);
    y += 14;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`Nivel: ${LEVELS[state.level].label} · Enfoque: ${state.focus} · Fichas para ganar: ${state.winTokens}`, margin, y);
    y += 12;
    const playerRows = state.players.map(p=>[
      p.name,
      `${finishedCount(p)}/${state.winTokens}`,
      `${p.stats.correct}/${p.stats.answered}`,
      gradeFor(p).toFixed(1),
      String(p.stats.captures),
      String(p.stats.moved)
    ]);
    doc.autoTable({startY:y+12, head:[['Jugador','Meta','Aciertos','Nota /5.0','Capturas','Mov. válidos']], body:playerRows, theme:'grid', styles:{fontSize:9}, headStyles:{fillColor:[16,24,39]}});
    y = doc.lastAutoTable.finalY + 18;

    const perfRows = [];
    for(const p of state.players){
      for(const [sec,st] of Object.entries(p.stats.bySection)) perfRows.push([p.name, sec, TOPICS[sec], `${st.correct}/${st.total}`, `${Math.round(100*st.correct/Math.max(1,st.total))}%`]);
      for(const [cat,st] of Object.entries(p.stats.byCategory)) perfRows.push([p.name, categoryLabel(cat), 'Categoría', `${st.correct}/${st.total}`, `${Math.round(100*st.correct/Math.max(1,st.total))}%`]);
    }
    if(perfRows.length){
      doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Desempeño por tema y categoría', margin, y); 
      doc.autoTable({startY:y+8, head:[['Jugador','Bloque','Tipo','Aciertos','Porcentaje']], body:perfRows, theme:'striped', styles:{fontSize:8}, headStyles:{fillColor:[30,64,175]}});
      y = doc.lastAutoTable.finalY + 18;
    }

    const plan = improvementPlan();
    if(y>650){ doc.addPage(); y=46; }
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Plan de mejora sugerido', margin, y); y += 16;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    const lines = doc.splitTextToSize(plan, 526);
    doc.text(lines, margin, y);
    y += lines.length*12 + 16;

    if(y>620){ doc.addPage(); y=46; }
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Historial reciente de tarjetas', margin, y);
    const auditRows = state.audit.slice(-45).map((a,i)=>[String(i+1), a.player, a.section, categoryLabel(a.category), a.correct ? 'Sí' : 'No', a.expired ? 'Tiempo' : '', a.prompt.slice(0,68)]);
    if(auditRows.length){
      doc.autoTable({startY:y+8, head:[['#','Jugador','Tema','Categoría','Correcta','Obs.','Pregunta']], body:auditRows, theme:'grid', styles:{fontSize:7,cellPadding:3}, headStyles:{fillColor:[146,64,14]}});
    }
    doc.save(`reporte_parchis_ecomat_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  function improvementPlan(){
    const notes = [];
    for(const p of state.players){
      for(const [sec,st] of Object.entries(p.stats.bySection)){
        const pct = st.correct/Math.max(1,st.total);
        if(st.total>0 && pct<0.7) notes.push(`${p.name}: repasar ${sec} ${TOPICS[sec]} (${Math.round(100*pct)}%).`);
      }
      for(const [cat,st] of Object.entries(p.stats.byCategory)){
        const pct = st.correct/Math.max(1,st.total);
        if(st.total>0 && pct<0.7) notes.push(`${p.name}: practicar preguntas de ${categoryLabel(cat)} (${Math.round(100*pct)}%).`);
      }
    }
    if(!notes.length) return 'El desempeño general fue fuerte. Para profundizar, conviene resolver ejercicios integradores que unan Bellman, Euler, principio del máximo y modelos con varias variables.';
    return notes.join(' ') + ' Sugerencia metodológica: resolver cada ejercicio con cinco pasos: identificar estado y control, escribir la dinámica, obtener la condición óptima, calcular la solución e interpretar el resultado.';
  }

  els.playerCount.addEventListener('change', renderPlayerConfig);
  els.loadDemoBtn.addEventListener('click', ()=>Array.from(els.playersConfig.querySelectorAll('.playerName')).forEach((i,idx)=>{ i.value = ['Ana','Bruno','Camila','David'][idx] || `Jugador ${idx+1}`; }));
  els.startGameBtn.addEventListener('click', startGame);
  els.rollBtn.addEventListener('click', rollDice);
  els.hintBtn.addEventListener('click', ()=>els.qHint.classList.toggle('hidden'));
  els.pauseTimerBtn.addEventListener('click', toggleTimerPause);
  els.continueBtn.addEventListener('click', continueAfterQuestion);
  els.finishGameBtn.addEventListener('click', ()=>endGame(false, 'Partida finalizada manualmente.'));
  els.newGameBtn.addEventListener('click', ()=>{ hide(els.game); hide(els.fullscreenOverlay); show(els.setup); checkFullscreenState(); });
  els.downloadReportBtn.addEventListener('click', downloadReport);
  els.returnSetupBtn.addEventListener('click', ()=>{ hide(els.finalModal); hide(els.game); hide(els.fullscreenOverlay); show(els.setup); checkFullscreenState(); });


  if(els.enterFullscreenBtn) els.enterFullscreenBtn.addEventListener('click', ()=>enterFullscreen());
  if(els.viewFrontBtn) els.viewFrontBtn.addEventListener('click', ()=>setBoardView('front'));
  if(els.view3DBtn) els.view3DBtn.addEventListener('click', ()=>setBoardView('3d'));
  if(els.view360Btn) els.view360Btn.addEventListener('click', ()=>setBoardView('360'));
  if(els.resumeFullscreenBtn) els.resumeFullscreenBtn.addEventListener('click', ()=>enterFullscreen());
  document.addEventListener('fullscreenchange', checkFullscreenState);
  window.addEventListener('resize', ()=>{ if(state) renderAll(); checkFullscreenState(); });
  window.addEventListener('orientationchange', ()=>setTimeout(()=>{ if(state) renderAll(); }, 200));

  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); });
  }

  initSetup();
  setBoardView('3d');
  typeset(document.body);
})();
