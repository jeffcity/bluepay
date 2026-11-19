import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const virtual=await readFile('src/pages/虚拟币代付订单管理/虚拟币代付订单管理-demo.html','utf8');
const general=await readFile('src/pages/代付订单管理/代付订单管理-demo.html','utf8');
const extract=(s,a,b)=>s.split(a)[1].split(b)[0];
function api(source,start,end,keys){const c=vm.createContext({Date,Number,Array});vm.runInContext(extract(source,start,end)+';globalThis.api={'+keys+'}',c);return c.api}
const v=api(virtual,'// PAYOUT_MODEL_START','// PAYOUT_MODEL_END','PAYOUT_HEADERS,payoutFixtures,filterPayoutOrders,summarizePayoutOrders,payoutOrderType');
const g=api(general,'// GENERAL_PAYOUT_MODEL_START','// GENERAL_PAYOUT_MODEL_END','GENERAL_PAYOUT_HEADERS,generalPayoutFixtures,filterGeneralPayouts,generalPayoutSummary,payoutOrderType');
test('两种代付页面存在内联脚本且均可解析',()=>{for(const s of [virtual,general]){const scripts=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];assert.ok(scripts.length>0);for(const [,script]of scripts)new vm.Script(script)}});
test('来源依据下分单号识别，与原订单类型独立且筛选不修改订单',()=>{for(const [a,fixture,filter,down,ordinary]of [[v,'payoutFixtures','filterPayoutOrders',3,23],[g,'generalPayoutFixtures','filterGeneralPayouts',4,22]]){const rows=a[fixture](),before=JSON.stringify(rows);assert.equal(a[filter](rows,{origin:'下分'}).length,down);assert.equal(a[filter](rows,{origin:'普通订单'}).length,ordinary);assert.equal(a[filter](rows,{origin:''}).length,26);assert.equal(a.payoutOrderType({sourceWithdrawalNo:'LS-W-DEMO'}),'下分');assert.equal(a.payoutOrderType({}),'普通订单');assert.equal(a[filter](rows,{origin:'未知'}).length,0);assert.equal(JSON.stringify(rows),before)}});
test('通用代付保留原13列顺序，新增来源列并独立组合原操作类型和状态',()=>{assert.equal(g.GENERAL_PAYOUT_HEADERS.length,14);assert.deepEqual(Array.from(g.GENERAL_PAYOUT_HEADERS).filter(x=>x!=='代付订单类型'),['','系统订单号','通道订单号/商家订单号','商户名/号','类型','交易金额','支付状态','通知状态','驳回描述','通道商','通道','提交时间/回调时间','操作']);const rows=g.generalPayoutFixtures(),matched=g.filterGeneralPayouts(rows,{origin:'下分',operationType:'强补订单',status:'打款中'});assert.equal(matched.length,2);assert.ok(matched.every(o=>o.operationType==='强补订单'&&o.sourceWithdrawalNo&&o.status==='打款中'));assert.equal(g.filterGeneralPayouts(rows,{origin:'普通订单',status:'已打款',notice:'通知成功',merchant:'远航演示商户'}).length,5)});
test('来源筛选后的统计覆盖全部匹配订单，空结果不遗留其他类型金额',()=>{const vr=v.filterPayoutOrders(v.payoutFixtures(),{origin:'下分'}),vs=v.summarizePayoutOrders(vr);assert.equal(vs.pending,110);assert.equal(vs.completed,0);const gr=g.filterGeneralPayouts(g.generalPayoutFixtures(),{origin:'下分'}),gs=g.generalPayoutSummary(gr);assert.equal(gs.pendingAmount,280);assert.equal(gs.rejectedAmount,100);assert.equal(gs.successAmount,0);assert.equal(gs.pendingCount,2);assert.equal(g.generalPayoutSummary([]).successRate,'0.0');assert.equal(g.generalPayoutSummary([]).pendingAmount,0);assert.equal(v.summarizePayoutOrders([]).pending,0)});
test('虚拟币来源可组合原币种和确认状态，新增列唯一且原金额能力不变',()=>{assert.equal(v.PAYOUT_HEADERS.length,29);assert.equal(v.PAYOUT_HEADERS.filter(x=>x==='代付订单类型').length,1);const rows=v.filterPayoutOrders(v.payoutFixtures(),{origin:'下分',currency:'USDT',status:'待支付',confirm:'已确认'});assert.equal(rows.length,2);assert.equal(v.filterPayoutOrders(v.payoutFixtures(),{origin:'下分',currency:'CNY'}).length,0)});
test('新页面完整保留列表详情字段，来源类型同时参与详情及CSV导出',()=>{for(const text of ['订单ID','商户ID','实际金额','商户服务费','通道服务费','商户代理返佣','通道代理返佣','订单成本','订单利润','请求返回内容','回调返回内容','查询返回内容','下单历史','来源下分单号'])assert.ok(general.includes(text),text);for(const text of ['强补订单','冲销订单','手提订单','亏损订单'])assert.ok(general.includes('<option>'+text+'</option>'));const c=vm.createContext({Number});vm.runInContext('const money=v=>Number(v).toFixed(2);'+extract(general,'// GENERAL_PAYOUT_MODEL_START','// GENERAL_PAYOUT_MODEL_END')+general.match(/function generalExportRows\(rows\)\{[^\n]+/)[0]+';globalThis.rows=generalExportRows(generalPayoutFixtures())',c);assert.equal(c.rows.length,26);assert.equal(c.rows[3][1],'下分');assert.equal(c.rows[0][1],'普通订单');assert.ok(c.rows.every(row=>row.length===12));assert.ok(virtual.includes("['来源下分单号',o.sourceWithdrawalNo||'—']"));assert.ok(virtual.includes('payoutOrderType(o),o.channelOrder'))});

test('回调日期筛选排除无回调记录，单边范围也有效', () => {
  const rows = g.generalPayoutFixtures();
  const start = '2026-11-19 00:00:00';
  const end = '2026-11-19 23:59:59';
  assert.equal(g.filterGeneralPayouts(rows, {origin:'下分', timeType:'callback', start}).length, 0);
  assert.equal(g.filterGeneralPayouts(rows, {timeType:'callback', start}).length, 3);
  assert.equal(g.filterGeneralPayouts(rows, {timeType:'callback', end}).length, 9);
  assert.equal(g.filterGeneralPayouts(rows, {timeType:'created', start, end}).length, 10);
});
