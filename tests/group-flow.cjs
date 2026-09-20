const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript'),{AsyncLocalStorage}=require('node:async_hooks');
const identity=new AsyncLocalStorage();
const rows=new Map();
const copy=r=>r?{...r}:null;
const repository={
 async findByInvite(invite){return copy([...rows.values()].find(r=>r.invite===invite))},
 async findForUser(uid){return copy([...rows.values()].find(r=>JSON.parse(r.state).members.some(m=>m.uid===uid)))},
 async createGroup(r){const owner=JSON.parse(r.state).owner;const existing=[...rows.values()].find(x=>JSON.parse(x.state).owner===owner);if(existing)return copy(existing);rows.set(r.id,copy(r));return copy(r)},
 async saveGroup(r,g){const current=rows.get(r.id);if(current.revision!==r.revision)return false;rows.set(r.id,{...r,state:JSON.stringify(g),revision:r.revision+1});return true;}
};
function compile(file,bindings){const src=fs.readFileSync(file,'utf8').replace(/^import .*;$/gm,'');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};new Function('exports',...Object.keys(bindings),js)(exports,...Object.values(bindings));return exports;}
const store=compile('db/store.ts',{});const api=compile('app/api/group/route.ts',{getCurrentUser:async()=>identity.getStore(),...store,...repository});let invite='';
async function call(i,body,expected=200,origin='https://test.local'){
 return identity.run(i===null?null:{userId:'test-'+i,email:'qa'+i+'@example.test'},async()=>{
 const req=new Request('https://test.local/api/group'+(!body&&invite?'?invite='+invite:''),body?{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'oai-authenticated-user-id':'test-0'},body:JSON.stringify({invite,...body})}:{headers:{'oai-authenticated-user-id':'test-0'}});
 const r=await api[body?'POST':'GET'](req);const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));return data;
 });
}
(async()=>{
 invite=(await call(0,{action:'create',name:'אחת',title:'בדיקה'})).group.invite;
 await Promise.all([1,2,3].map(i=>call(i,{action:'join',name:'משתתפת '+i})));
 assert.equal((await call(0)).group.members.length,4);
 await call(4,{action:'join',name:'חמישית'},409);
 await call(0,{action:'start'},409);
 await call(0,{action:'goals',goal:2,steps:6000,workouts:2},409);
 for(let i=0;i<4;i++)await call(i,{action:'vote',days:30});
 assert.equal((await call(0)).group.consensus,30);
 await Promise.all([0,1,2,3].map(i=>call(i,{action:'goals',goal:i+1,steps:6000,workouts:2})));
 for(let i=0;i<4;i++){const g=(await call(i)).group;assert.equal(g.me.goal,i+1);assert(g.members.every(m=>!('goal'in m)&&!('uid'in m)&&!('email'in m)));}
 assert.equal((await call(null)).group,null);
 await call(null,{action:'vote',days:90},401);
 await call(0,{action:'vote',days:90},403,'https://attacker.test');
 await call(4,{action:'vote',days:60},403);
 await call(1,{action:'start'},403);
 await call(0,{action:'goals',goal:2,steps:-1,workouts:2},400);
 await call(0,{action:'goals',goal:null,steps:6000,workouts:2},400);
 await call(3,{action:'vote',days:60});await call(0,{action:'start'},409);
 await call(3,{action:'vote',days:30});assert((await call(0)).group.canStart);
 const started=(await call(0,{action:'start'})).group;assert(started.start);
 for(let i=0;i<4;i++)assert.equal((await call(i)).group.start,started.start);
 await call(0,{action:'vote',days:90},409);
 console.log('PASS: four independent identities, concurrent joins and goals, private projections, ignored OpenAI identity headers, CSRF, consensus and shared start. Repository and identity provider mocked; live email delivery not tested.');
})().catch(e=>{console.error(e);process.exitCode=1});
