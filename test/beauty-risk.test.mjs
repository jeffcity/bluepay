import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source=fs.readFileSync(new URL('../src/pages/美人桥骗子库/美人桥骗子库-demo.html',import.meta.url),'utf8');
const ctx=vm.createContext({Date,encodeURIComponent,structuredClone});
vm.runInContext(source.split('// RISK_MODEL_START')[1].split('// RISK_MODEL_END')[0]+`\nglobalThis.api={riskSeed,riskEnsure,riskReadCases,riskReadSupplements,riskReadRecord,riskEvidence,riskSortPublished,riskSimilar,riskSubmitFor,riskEdit,riskReview,riskLogs,riskGetRecord,riskRelatedReports};`,ctx);
const api=ctx.api,manager={role:'manager',name:'测试管理员'},reviewer={role:'reviewer',name:'测试审核员'},reader={role:'reader',name:'只读人员'},a={role:'merchant',merchant:'beauty-a',name:'商户A'},b={role:'merchant',merchant:'beauty-b',name:'商户B'},guest={role:'guest',name:'未登录'};
function state(){return api.riskEnsure(api.riskSeed())}
function editInput(r,extra={}){return {baseRevision:r.revision||0,reason:r.reason,description:r.description+' 补充核实结果。',images:structuredClone(r.images),level:r.level||'warning',note:'核实后修改',...extra}}
function input(extra={}){return {appid:'90010004',reason:'资金诈骗',description:'独立的演示事件，提交后台核查。',images:[{name:'演示',original:'raw-demo'}],requestId:'request-'+Math.random(),distinct:true,...extra}}
function review(s,id,decision,input,actor){const r=api.riskGetRecord(s,id),parent=r?.caseId?s.cases.find(c=>c.id===r.caseId):null;return api.riskReview(s,id,decision,{level:r?.level||parent?.level,...input,baseRevision:r?.revision,parentRevision:parent?.revision},actor)}
function checkImages(r){r.images.forEach(x=>{x.checked=true;x.public='safe-public-image'})}
test('骗子库所有内联脚本语法有效，提交表单只显示APPID',()=>{for(const m of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);assert(!source.includes('id="platformName"'));assert(source.includes('id="reportSort"'));});
test('旧状态扩展保留原业务数据',()=>{const s=api.riskSeed(),before=JSON.stringify(s.cases);api.riskEnsure(s);assert.equal(JSON.stringify(s.cases.map(({revision,...r})=>r)),before);assert.equal(s.revisions.length,0);api.riskEnsure(s);assert.equal(s.cases.length,7);});
test('审核时间与提交时间排序互相独立，不修改原顺序',()=>{const rows=[{id:'a',status:'published',submittedAt:'2026-11-10',publishedAt:'2026-11-11',reviewedAt:'2026-11-16'},{id:'b',status:'published',submittedAt:'2026-11-15',publishedAt:'2026-11-15'}];assert.equal(api.riskSortPublished(rows,'reviewed')[0].id,'a');assert.equal(api.riskSortPublished(rows,'submitted')[0].id,'b');assert.equal(rows[0].id,'a');});
test('公开投影共享全部已审核通报，不返回提交商户、原件或内部日志',()=>{const s=state(),pub=api.riskReadCases(s,a);assert.equal(pub.length,6);assert.equal(api.riskReadCases(s,b).length,6);assert(pub.every(x=>!('merchant'in x)&&!('logs'in x)&&x.images.every(i=>!('original'in i))));assert.equal(api.riskReadSupplements(s,'CASE-DEMO-0001',a).length,0);assert.throws(()=>api.riskReadCases(s,guest),/无此操作权限/);});
test('未登录不能提交；只读账号不能审核、编辑或读取原件',()=>{const s=state(),snapshot=JSON.stringify(s);assert.throws(()=>api.riskSubmitFor(s,input(),guest),/无此操作权限/);assert.throws(()=>api.riskEdit(s,s.cases[0].id,editInput(s.cases[0]),reader),/无此操作权限/);assert.throws(()=>review(s,'CASE-DEMO-0007','reject',{reason:'测试'},reader),/无此操作权限/);assert.throws(()=>api.riskEvidence(s,'CASE-DEMO-0001',0,reader,true),/无此操作权限/);assert.equal(JSON.stringify(s),snapshot);});
test('审核员能核查原件，但不能编辑通报',()=>{const s=state();assert(api.riskEvidence(s,'CASE-DEMO-0007',0,reviewer,true));assert.throws(()=>api.riskEdit(s,s.cases[0].id,editInput(s.cases[0]),reviewer),/无此操作权限/);});
test('只读详情连同修改快照均不包含原件字段',()=>{const s=state(),r=s.cases[0];api.riskEdit(s,r.id,editInput(r),manager);const rev=s.revisions[0];const copy=api.riskReadRecord(s,rev.id,reader);assert(!JSON.stringify(copy).includes('"original"'));assert(!JSON.stringify(api.riskLogs(s,reader)).includes('"original"'));});
test('已发布通报编辑后进入重审，期间原通报不变且不能并发提交第二份修改',()=>{const s=state(),r=s.cases[0],before=JSON.stringify({description:r.description,level:r.level,images:r.images});const rev=api.riskEdit(s,r.id,editInput(r),manager);assert.equal(rev.status,'pending');assert.equal(JSON.stringify({description:r.description,level:r.level,images:r.images}),before);assert.throws(()=>api.riskEdit(s,r.id,editInput(r),manager),/已有修改待审核/);assert.equal(api.riskReadCases(s,a).find(x=>x.id===r.id).description,r.description);});
test('修改审核通过后替换内容并保留初次发布时间和前后记录',()=>{const s=state(),r=s.cases[0],publishedAt=r.publishedAt,rev=api.riskEdit(s,r.id,editInput(r,{reason:'其他风险事件'}),manager);review(s,rev.id,'approve',{},reviewer);assert.equal(r.description,rev.description);assert.equal(r.reason,'其他风险事件');assert.equal(r.publishedAt,publishedAt);assert.equal(r.revision,1);assert(r.logs.some(l=>l.before&&l.after));assert.equal(rev.reviewer,reviewer.name);});
test('修改驳回不改变原公开内容、等级和图片',()=>{const s=state(),r=s.cases[0],before=JSON.stringify({description:r.description,reason:r.reason,images:r.images,level:r.level}),rev=api.riskEdit(s,r.id,editInput(r),manager);review(s,rev.id,'reject',{reason:'请补充证据'},reviewer);assert.equal(rev.status,'rejected');assert.equal(JSON.stringify({description:r.description,reason:r.reason,images:r.images,level:r.level}),before);});
test('发布后的等级调整也先审核，审核后有等级前后记录',()=>{const s=state(),r=s.cases[0],old=r.level,rev=api.riskEdit(s,r.id,editInput(r,{description:r.description,level:'normal',levelOnly:true}),manager);assert.equal(rev.changeType,'level');assert.equal(r.level,old);review(s,rev.id,'approve',{},reviewer);assert.equal(r.level,'normal');assert(r.logs.at(-1).action.includes('等级调整'));});
test('待审核内容可编辑并留痕，不提前进入公开列表',()=>{const s=state(),r=api.riskGetRecord(s,'CASE-DEMO-0007');api.riskEdit(s,r.id,editInput(r),manager);assert.equal(r.status,'pending');assert.equal(r.revision,1);assert(!api.riskReadCases(s,a).some(c=>c.id===r.id));});
test('新图片未检查时不能通过修改审核，失败保留原内容',()=>{const s=state(),r=s.cases[0],old=r.description,rev=api.riskEdit(s,r.id,editInput(r,{images:[{name:'新图',original:'raw-new',public:'',checked:false}]}),manager);assert.throws(()=>review(s,rev.id,'approve',{},reviewer),/检查所有截图/);assert.equal(r.description,old);assert.equal(rev.status,'pending');checkImages(rev);review(s,rev.id,'approve',{},reviewer);assert.equal(r.images[0].public,'safe-public-image');});
test('已公开补充修改也重审，审核前保持原补充',()=>{const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008');checkImages(r);review(s,r.id,'approve',{},reviewer);const old=r.description,rev=api.riskEdit(s,r.id,editInput(r),manager);assert.equal(api.riskReadSupplements(s,r.caseId,a)[0].description,old);review(s,rev.id,'approve',{},reviewer);assert.equal(api.riskReadSupplements(s,r.caseId,a)[0].description,rev.description);});
test('相似内容会提醒但不合并，不阻止不同APPID的新事件提交',()=>{const s=state(),base=s.cases[0],data=input({reason:base.reason,description:base.description});const same=api.riskSimilar(s,data);assert(same.some(x=>!x.sameAppid&&x.score===1));const r=api.riskSubmitFor(s,data,b);assert.notEqual(r.id,base.id);assert(r.similarCaseIds.includes(base.id));assert.equal(r.status,'pending');});
test('重复请求只创建一条记录，其他商户不能复用请求标识',()=>{const s=state(),data=input();const r=api.riskSubmitFor(s,data,a),count=s.cases.length;assert.equal(api.riskSubmitFor(s,data,a).id,r.id);assert.equal(s.cases.length,count);assert.throws(()=>api.riskSubmitFor(s,data,b),/重新打开表单/);});

test('编辑窗口打开后原通报变化，旧编辑不能覆盖新内容',()=>{const s=state(),r=s.cases[0],stale=editInput(r),rev=api.riskEdit(s,r.id,editInput(r,{description:'较新的核查结果'}),manager);review(s,rev.id,'approve',{},reviewer);assert.throws(()=>api.riskEdit(s,r.id,stale,manager),/重新打开编辑/);assert.equal(r.description,'较新的核查结果');});
test('待审窗口打开后编辑了证据，旧审核不能覆盖新版本',()=>{const s=state(),r=api.riskGetRecord(s,'CASE-DEMO-0007'),baseRevision=r.revision;api.riskEdit(s,r.id,editInput(r),manager);assert.throws(()=>api.riskReview(s,r.id,'reject',{reason:'旧的审核意见',baseRevision},reviewer),/重新打开核对/);assert.equal(r.status,'pending');});
test('相同请求标识不能换事由或图片悄悄复用旧记录',()=>{const s=state(),data=input();api.riskSubmitFor(s,data,a);assert.throws(()=>api.riskSubmitFor(s,{...data,reason:'恶意举报'},a),/重新打开表单/);assert.throws(()=>api.riskSubmitFor(s,{...data,images:[{name:'不同图',original:'other'}]},a),/重新打开表单/);});

test('相关通报按APPID关联，排除自己和所有未发布状态',()=>{const s=state(),r=s.cases[0];assert.equal(api.riskRelatedReports(s,r.id).length,1);assert.equal(api.riskRelatedReports(s,r.id)[0].id,'CASE-DEMO-0004');const candidate=api.riskSubmitFor(s,input({appid:r.appid}),b);assert.equal(api.riskRelatedReports(s,r.id).length,1);checkImages(candidate);review(s,candidate.id,'approve',{level:'warning'},reviewer);assert.equal(api.riskRelatedReports(s,r.id).length,2);candidate.status='rejected';assert.equal(api.riskRelatedReports(s,r.id).length,1);assert.equal(api.riskRelatedReports(s,candidate.id).length,0);});
test('相关通报不把补充或修改审核重复计数，也不返回私有字段',()=>{const s=state(),r=s.cases[0],sup=api.riskGetRecord(s,'SUP-DEMO-0008');checkImages(sup);review(s,sup.id,'approve',{},reviewer);api.riskEdit(s,r.id,editInput(r),manager);const rows=api.riskRelatedReports(s,r.id);assert.equal(rows.length,1);assert(rows.every(x=>x.id!==r.id&&x.appid===r.appid));assert(!JSON.stringify(rows).includes('original'));assert(rows.every(x=>!('merchant'in x)&&!('images'in x)&&!('logs'in x)));});
test('只有一条公开通报的APPID显示零条相关通报，驳回记录不计数',()=>{const s=state(),r=api.riskGetRecord(s,'CASE-DEMO-0007');checkImages(r);review(s,r.id,'approve',{level:'warning'},reviewer);assert.equal(api.riskRelatedReports(s,r.id).length,0);const another=api.riskSubmitFor(s,input(),a);review(s,another.id,'reject',{reason:'证据需补充'},reviewer);assert.equal(api.riskRelatedReports(s,r.id).length,0);});

test('同APPID新建不需要先认定为不同事件，仍生成独立待审记录',()=>{const s=state(),data=input({appid:'90010001'});delete data.distinct;const r=api.riskSubmitFor(s,data,a);assert.equal(r.status,'pending');assert.equal(r.appid,'90010001');assert.equal(api.riskReadCases(s,a).length,6);});


test('描述修正通过后不沿用旧摘要，待审和驳回保留原摘要，仅调等级不改摘要',()=>{
  const s=state(),r=s.cases[0],oldTitle=r.title;
  const rejected=api.riskEdit(s,r.id,editInput(r,{description:'待核实的更正经过。'}),manager);
  assert.equal(r.title,oldTitle);
  review(s,rejected.id,'reject',{reason:'证据不足'},reviewer);
  assert.equal(r.title,oldTitle);
  const level=api.riskEdit(s,r.id,editInput(r,{description:r.description,level:'normal',levelOnly:true}),manager);
  review(s,level.id,'approve',{},reviewer);
  assert.equal(r.title,oldTitle);
  const approved=api.riskEdit(s,r.id,editInput(r,{description:'经核实本次为另一项争议，公开修正经过。'}),manager);
  review(s,approved.id,'approve',{},reviewer);
  assert.equal(r.title,undefined);
  assert.equal(r.description,approved.description);
  assert.equal(api.riskReadCases(s,a).find(x=>x.id===r.id).title,undefined);
  assert.equal(api.riskRelatedReports(s,'CASE-DEMO-0004').find(x=>x.id===r.id).title,undefined);
  const pending=api.riskGetRecord(s,'CASE-DEMO-0007');
  pending.title='过时摘要';
  api.riskEdit(s,pending.id,editInput(pending),manager);
  assert.equal(pending.title,undefined);
});


test('补充审核通过必选风险等级，通过后同步原通报和公开详情',()=>{
 const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008'),parent=s.cases[0];checkImages(r);
 const before=JSON.stringify(s);
 assert.throws(()=>api.riskReview(s,r.id,'approve',{baseRevision:r.revision,parentRevision:parent.revision},reviewer),/请选择风险等级/);
 assert.equal(JSON.stringify(s),before);
 review(s,r.id,'approve',{level:'normal'},reviewer);
 assert.equal(r.level,'normal');assert.equal(parent.level,'normal');assert.equal(parent.revision,1);
 assert.equal(api.riskReadCases(s,a).find(x=>x.id===parent.id).level,'normal');
 assert.equal(api.riskReadSupplements(s,parent.id,a)[0].level,'normal');
 assert(parent.logs.some(x=>x.supplementId===r.id&&x.before.level==='high'&&x.after.level==='normal'));
 assert(api.riskLogs(s,manager).some(x=>x.action==='补充审核同步风险等级'));
});
test('补充被驳回不改原通报等级，待审修改不会覆盖补充审核后的新等级',()=>{
 const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008'),parent=s.cases[0];
 review(s,r.id,'reject',{reason:'证据不充分',level:'normal'},reviewer);assert.equal(parent.level,'high');
 const next=api.riskSubmitFor(s,input({appid:parent.appid,reason:parent.reason,caseId:parent.id}),a);checkImages(next);
 const rev=api.riskEdit(s,parent.id,editInput(parent),manager);
 review(s,next.id,'approve',{level:'warning'},reviewer);
 assert.throws(()=>review(s,rev.id,'approve',{},reviewer),/原通报状态已变化/);
 assert.equal(parent.level,'warning');assert.equal(rev.status,'pending');
});
test('旧补充审核窗口不能覆盖后来已审的风险等级',()=>{
 const s=state(),parent=s.cases[0],r=api.riskGetRecord(s,'SUP-DEMO-0008');checkImages(r);const stale=parent.revision;
 const rev=api.riskEdit(s,parent.id,editInput(parent,{description:parent.description,level:'normal',levelOnly:true}),manager);
 review(s,rev.id,'approve',{},reviewer);
 assert.throws(()=>api.riskReview(s,r.id,'approve',{level:'warning',baseRevision:r.revision,parentRevision:stale},reviewer),/重新打开审核核对/);
 assert.equal(parent.level,'normal');assert.equal(r.status,'pending');
});
test('历史主题字段不进入公开通报及相关通报投影',()=>{
 const s=state();s.cases[0].title='历史主题';
 assert(!('title' in api.riskReadCases(s,a)[0]));
 assert(api.riskRelatedReports(s,'CASE-DEMO-0004').every(x=>!('title' in x)));
});


test('补充审核只接受三种风险等级，非法值不会改变原通报或审核状态',()=>{
 for(const level of ['critical','toString','__proto__',42]){
  const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008'),parent=s.cases[0];checkImages(r);const before=JSON.stringify(s);
  assert.throws(()=>api.riskReview(s,r.id,'approve',{level,baseRevision:r.revision,parentRevision:parent.revision},reviewer),/请选择风险等级/);
  assert.equal(JSON.stringify(s),before);
 }
});
test('补充已记录等级后，同值编辑不创建修改，描述修改保留本次补充等级',()=>{
 const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008');checkImages(r);review(s,r.id,'approve',{level:'normal'},reviewer);
 assert.throws(()=>api.riskEdit(s,r.id,editInput(r,{description:r.description}),manager),/内容没有变化/);
 assert.equal(s.revisions.length,0);
 const rev=api.riskEdit(s,r.id,editInput(r),manager);assert.equal(rev.level,'normal');
 review(s,rev.id,'approve',{},reviewer);assert.equal(r.level,'normal');assert.equal(s.cases[0].level,'normal');
});


test('商户提交新案例及补充不写后台操作记录，提交身份及时间仍保留',()=>{
 const s=state(),before=api.riskLogs(s,manager).length;
 const r=api.riskSubmitFor(s,input(),a);
 const parent=s.cases.find(x=>x.status==='published');
 const sup=api.riskSubmitFor(s,input({appid:parent.appid,reason:parent.reason,caseId:parent.id}),b);
 assert.equal(api.riskLogs(s,manager).length,before);
 assert.equal(s.events.length,0);assert.equal(r.logs.length,0);assert.equal(sup.logs.length,0);
 assert.equal(r.merchant,a.merchant);assert.equal(sup.merchant,b.merchant);
 assert(r.submittedAt);assert(sup.submittedAt);
 assert.equal(api.riskReadRecord(s,r.id,reviewer).merchant,a.merchant);
 checkImages(r);review(s,r.id,'approve',{level:'warning'},reviewer);
 assert(api.riskLogs(s,manager).some(x=>x.record===r.id&&x.action==='审核通过'));
});
test('已有浏览器数据不展示商户提交日志，同名后台操作仍保留且不改原始数据',()=>{
 const s=state(),r=s.cases[0];
 s.events.push({actor:'同名人员',action:'提交新案例',record:r.id,time:'2026-11-18T01:00:00Z'});
 s.events.push({actor:'同名人员',source:'merchant',action:'审核通过',record:r.id,time:'2026-11-18T02:00:00Z'});
 s.events.push({actor:'同名人员',source:'admin',action:'审核通过',record:r.id,time:'2026-11-18T03:00:00Z'});
 r.logs.push({actor:'同名人员',action:'提交补充证据',time:'2026-11-18T01:00:00Z'});
 r.logs.push({actor:'同名人员',action:'编辑待审核内容：核对',time:'2026-11-18T02:00:00Z'});
 const before=JSON.stringify(s),rows=api.riskLogs(s,reader).filter(x=>x.actor==='同名人员');
 assert.equal(rows.length,2);assert(rows.some(x=>x.action==='审核通过'));assert(rows.some(x=>x.detail==='编辑待审核内容：核对'));
 assert(!api.riskReadRecord(s,r.id,reviewer).logs.some(x=>x.action==='提交补充证据'));
 assert.equal(JSON.stringify(s),before);
});
