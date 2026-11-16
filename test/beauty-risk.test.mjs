import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source=fs.readFileSync(new URL('../src/pages/美人桥骗子库/美人桥骗子库-demo.html',import.meta.url),'utf8');
const ctx=vm.createContext({Date,encodeURIComponent,structuredClone});
vm.runInContext(source.split('// RISK_MODEL_START')[1].split('// RISK_MODEL_END')[0]+`\nglobalThis.api={riskSeed,riskEnsure,riskReadCases,riskReadSupplements,riskReadRecord,riskEvidence,riskSortPublished,riskSimilar,riskSubmitFor,riskEdit,riskReview,riskDeleteFor,riskSetPolicy,riskHandleWarning,riskAttention,riskLogs,riskGetRecord,riskRelatedReports};`,ctx);
const api=ctx.api,manager={role:'manager',name:'测试管理员'},reviewer={role:'reviewer',name:'测试审核员'},reader={role:'reader',name:'只读人员'},a={role:'merchant',merchant:'beauty-a',name:'商户A'},b={role:'merchant',merchant:'beauty-b',name:'商户B'},guest={role:'guest',name:'未登录'};
function state(){return api.riskEnsure(api.riskSeed())}
function editInput(r,extra={}){return {baseRevision:r.revision||0,reason:r.reason,description:r.description+' 补充核实结果。',images:structuredClone(r.images),level:r.level||'warning',note:'核实后修改',...extra}}
function input(extra={}){return {appid:'90010004',reason:'资金诈骗',description:'独立的演示事件，提交后台核查。',images:[{name:'演示',original:'raw-demo'}],requestId:'request-'+Math.random(),distinct:true,...extra}}
function review(s,id,decision,input,actor){return api.riskReview(s,id,decision,{...input,baseRevision:api.riskGetRecord(s,id)?.revision},actor)}
function checkImages(r){r.images.forEach(x=>{x.checked=true;x.public='safe-public-image'})}
test('骗子库所有内联脚本语法有效，提交表单只显示APPID',()=>{for(const m of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);assert(!source.includes('id="platformName"'));assert(source.includes('id="reportSort"'));});
test('旧状态扩展保留原业务数据',()=>{const s=api.riskSeed(),before=JSON.stringify(s.cases);api.riskEnsure(s);assert.equal(JSON.stringify(s.cases.map(({revision,...r})=>r)),before);assert.equal(s.revisions.length,0);api.riskEnsure(s);assert.equal(s.cases.length,7);});
test('审核时间与提交时间排序互相独立，不修改原顺序',()=>{const rows=[{id:'a',status:'published',submittedAt:'2026-11-10',publishedAt:'2026-11-11',reviewedAt:'2026-11-16'},{id:'b',status:'published',submittedAt:'2026-11-15',publishedAt:'2026-11-15'}];assert.equal(api.riskSortPublished(rows,'reviewed')[0].id,'a');assert.equal(api.riskSortPublished(rows,'submitted')[0].id,'b');assert.equal(rows[0].id,'a');});
test('公开投影共享全部已审核通报，不返回提交商户、原件或内部日志',()=>{const s=state(),pub=api.riskReadCases(s,a);assert.equal(pub.length,6);assert.equal(api.riskReadCases(s,b).length,6);assert(pub.every(x=>!('merchant'in x)&&!('logs'in x)&&x.images.every(i=>!('original'in i))));assert.equal(api.riskReadSupplements(s,'CASE-DEMO-0001',a).length,0);assert.throws(()=>api.riskReadCases(s,guest),/无此操作权限/);});
test('未登录不能提交；只读账号不能审核、编辑、删除或读取原件',()=>{const s=state(),snapshot=JSON.stringify(s);assert.throws(()=>api.riskSubmitFor(s,input(),guest),/无此操作权限/);assert.throws(()=>api.riskEdit(s,s.cases[0].id,editInput(s.cases[0]),reader),/无此操作权限/);assert.throws(()=>api.riskDeleteFor(s,s.cases[0].id,'测试',reader),/无此操作权限/);assert.throws(()=>review(s,'CASE-DEMO-0007','reject',{reason:'测试'},reader),/无此操作权限/);assert.throws(()=>api.riskEvidence(s,'CASE-DEMO-0001',0,reader,true),/无此操作权限/);assert.equal(JSON.stringify(s),snapshot);});
test('审核员能核查原件，但不能编辑通报和处置提醒',()=>{const s=state();assert(api.riskEvidence(s,'CASE-DEMO-0007',0,reviewer,true));assert.throws(()=>api.riskEdit(s,s.cases[0].id,editInput(s.cases[0]),reviewer),/无此操作权限/);assert.throws(()=>api.riskSetPolicy(s,{enabled:true,minutes:10,count:3},reviewer),/无此操作权限/);});
test('只读详情连同修改快照均不包含原件字段',()=>{const s=state(),r=s.cases[0];api.riskEdit(s,r.id,editInput(r),manager);const rev=s.revisions[0];const copy=api.riskReadRecord(s,rev.id,reader);assert(!JSON.stringify(copy).includes('"original"'));assert(!JSON.stringify(api.riskLogs(s,reader)).includes('"original"'));});
test('已发布通报编辑后进入重审，期间原通报不变且不能并发提交第二份修改',()=>{const s=state(),r=s.cases[0],before=JSON.stringify({description:r.description,level:r.level,images:r.images});const rev=api.riskEdit(s,r.id,editInput(r),manager);assert.equal(rev.status,'pending');assert.equal(JSON.stringify({description:r.description,level:r.level,images:r.images}),before);assert.throws(()=>api.riskEdit(s,r.id,editInput(r),manager),/已有修改待审核/);assert.equal(api.riskReadCases(s,a).find(x=>x.id===r.id).description,r.description);});
test('修改审核通过后替换内容并保留初次发布时间和前后记录',()=>{const s=state(),r=s.cases[0],publishedAt=r.publishedAt,rev=api.riskEdit(s,r.id,editInput(r,{reason:'其他风险事件'}),manager);review(s,rev.id,'approve',{},reviewer);assert.equal(r.description,rev.description);assert.equal(r.reason,'其他风险事件');assert.equal(r.publishedAt,publishedAt);assert.equal(r.revision,1);assert(r.logs.some(l=>l.before&&l.after));assert.equal(rev.reviewer,reviewer.name);});
test('修改驳回不改变原公开内容、等级和图片',()=>{const s=state(),r=s.cases[0],before=JSON.stringify({description:r.description,reason:r.reason,images:r.images,level:r.level}),rev=api.riskEdit(s,r.id,editInput(r),manager);review(s,rev.id,'reject',{reason:'请补充证据'},reviewer);assert.equal(rev.status,'rejected');assert.equal(JSON.stringify({description:r.description,reason:r.reason,images:r.images,level:r.level}),before);});
test('发布后的等级调整也先审核，审核后有等级前后记录',()=>{const s=state(),r=s.cases[0],old=r.level,rev=api.riskEdit(s,r.id,editInput(r,{description:r.description,level:'normal',levelOnly:true}),manager);assert.equal(rev.changeType,'level');assert.equal(r.level,old);review(s,rev.id,'approve',{},reviewer);assert.equal(r.level,'normal');assert(r.logs.at(-1).action.includes('等级调整'));});
test('待审核内容可编辑并留痕，不提前进入公开列表',()=>{const s=state(),r=api.riskGetRecord(s,'CASE-DEMO-0007');api.riskEdit(s,r.id,editInput(r),manager);assert.equal(r.status,'pending');assert.equal(r.revision,1);assert(!api.riskReadCases(s,a).some(c=>c.id===r.id));});
test('新图片未检查时不能通过修改审核，失败保留原内容',()=>{const s=state(),r=s.cases[0],old=r.description,rev=api.riskEdit(s,r.id,editInput(r,{images:[{name:'新图',original:'raw-new',public:'',checked:false}]}),manager);assert.throws(()=>review(s,rev.id,'approve',{},reviewer),/检查所有截图/);assert.equal(r.description,old);assert.equal(rev.status,'pending');checkImages(rev);review(s,rev.id,'approve',{},reviewer);assert.equal(r.images[0].public,'safe-public-image');});
test('原通报删除后，旧修改不能再次将其公开',()=>{const s=state(),r=s.cases[0],rev=api.riskEdit(s,r.id,editInput(r),manager);api.riskDeleteFor(s,r.id,'已确认无须公开',manager);assert.throws(()=>review(s,rev.id,'approve',{},reviewer),/原通报状态已变化/);assert(!api.riskReadCases(s,a).some(x=>x.id===r.id));review(s,rev.id,'reject',{reason:'原通报已删除'},reviewer);assert.equal(rev.status,'rejected');});
test('已公开补充修改也重审，审核前保持原补充',()=>{const s=state(),r=api.riskGetRecord(s,'SUP-DEMO-0008');checkImages(r);review(s,r.id,'approve',{},reviewer);const old=r.description,rev=api.riskEdit(s,r.id,editInput(r),manager);assert.equal(api.riskReadSupplements(s,r.caseId,a)[0].description,old);review(s,rev.id,'approve',{},reviewer);assert.equal(api.riskReadSupplements(s,r.caseId,a)[0].description,rev.description);});
test('相似内容会提醒但不合并，不阻止不同APPID的新事件提交',()=>{const s=state(),base=s.cases[0],data=input({reason:base.reason,description:base.description});const same=api.riskSimilar(s,data);assert(same.some(x=>!x.sameAppid&&x.score===1));const r=api.riskSubmitFor(s,data,b);assert.notEqual(r.id,base.id);assert(s.warnings.some(w=>w.type==='similar'&&w.recordId===r.id));assert.equal(r.status,'pending');});
test('频繁提交和关注标记都不拦截后续提交',()=>{const s=state();for(const r of [...s.cases,...s.supplements])r.submittedAt='2000-01-01T00:00:00Z';api.riskSetPolicy(s,{enabled:true,minutes:10,count:2},manager);for(let i=0;i<3;i++)api.riskSubmitFor(s,input({description:'频率演示事件'+i}),a);assert.equal(s.warnings.filter(w=>w.type==='frequent').length,2);api.riskAttention(s,a.merchant,'人工核查',true,manager);const next=api.riskSubmitFor(s,input({description:'被关注后仍可正常提交'}),a);assert.equal(next.status,'pending');assert.equal(s.attention.length,1);});
test('重复请求不重复创建提醒，其他商户不能复用请求标识',()=>{const s=state(),data=input();const r=api.riskSubmitFor(s,data,a),count=s.warnings.length;assert.equal(api.riskSubmitFor(s,data,a).id,r.id);assert.equal(s.warnings.length,count);assert.throws(()=>api.riskSubmitFor(s,data,b),/重新打开表单/);});
test('提醒处理与解除关注需要说明，并生成日志',()=>{const s=state(),base=s.cases[0];api.riskSubmitFor(s,input({description:base.description,reason:base.reason}),a);const w=s.warnings[0];assert.throws(()=>api.riskHandleWarning(s,w.id,'',manager),/处理说明/);api.riskHandleWarning(s,w.id,'已核对，属于不同事件',manager);assert.equal(w.status,'handled');api.riskAttention(s,a.merchant,'已核查',true,manager);api.riskAttention(s,a.merchant,'关注解除',false,manager);assert.equal(s.attention.length,0);assert(api.riskLogs(s,manager).some(l=>l.action==='处理提交提醒'));assert.throws(()=>api.riskLogs(s,a),/无此操作权限/);});

test('编辑窗口打开后原通报变化，旧编辑不能覆盖新内容',()=>{const s=state(),r=s.cases[0],stale=editInput(r),rev=api.riskEdit(s,r.id,editInput(r,{description:'较新的核查结果'}),manager);review(s,rev.id,'approve',{},reviewer);assert.throws(()=>api.riskEdit(s,r.id,stale,manager),/重新打开编辑/);assert.equal(r.description,'较新的核查结果');});
test('待审窗口打开后编辑了证据，旧审核不能覆盖新版本',()=>{const s=state(),r=api.riskGetRecord(s,'CASE-DEMO-0007'),baseRevision=r.revision;api.riskEdit(s,r.id,editInput(r),manager);assert.throws(()=>api.riskReview(s,r.id,'reject',{reason:'旧的审核意见',baseRevision},reviewer),/重新打开核对/);assert.equal(r.status,'pending');});
test('相同请求标识不能换事由或图片悄悄复用旧记录',()=>{const s=state(),data=input();api.riskSubmitFor(s,data,a);assert.throws(()=>api.riskSubmitFor(s,{...data,reason:'恶意举报'},a),/重新打开表单/);assert.throws(()=>api.riskSubmitFor(s,{...data,images:[{name:'不同图',original:'other'}]},a),/重新打开表单/);});

test('相关通报按APPID关联，排除自己和所有未发布状态',()=>{const s=state(),r=s.cases[0];assert.equal(api.riskRelatedReports(s,r.id).length,1);assert.equal(api.riskRelatedReports(s,r.id)[0].id,'CASE-DEMO-0004');const candidate=api.riskSubmitFor(s,input({appid:r.appid}),b);assert.equal(api.riskRelatedReports(s,r.id).length,1);checkImages(candidate);review(s,candidate.id,'approve',{level:'warning'},reviewer);assert.equal(api.riskRelatedReports(s,r.id).length,2);api.riskDeleteFor(s,candidate.id,'演示移除',manager);assert.equal(api.riskRelatedReports(s,r.id).length,1);assert.equal(api.riskRelatedReports(s,candidate.id).length,0);});
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
