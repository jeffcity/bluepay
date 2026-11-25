import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile('src/pages/代付通道管理/代付通道管理-demo.html','utf8');
const withdraw=await readFile('src/pages/机器人分层播报与多人确认/机器人分层播报与多人确认-demo.html','utf8');
const model=s=>s.split('// PAYOUT_CHANNEL_MODEL_START')[1].split('// PAYOUT_CHANNEL_MODEL_END')[0];
const component=withdraw.split('// THIRD_PARTY_PAYOUT_START')[1].split('// THIRD_PARTY_PAYOUT_END')[0];
const storage=new Map(),context=vm.createContext({Map,Number,Array,JSON,Set,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}});
vm.runInContext(model(source)+'\n'+component+';globalThis.a={seed:payoutChannelSeed,read:readPayoutChannelState,write:savePayoutChannelState,eligible:eligiblePayoutChannels,filter:filterPayoutChannels,save:savePayoutChannel,setProduct:setPayoutChannelProduct,submit:submitThirdPartyPayout,select:selectedThirdPartyChannel,body:thirdPartyPayoutBody}',context);
const a=context.a;
const form=(changes={})=>({name:'测试演示通道',provider:'远航演示通道商',interface:'USDT',category:'下分',productType:'DEMO-CRYPTO',weight:2,group:'',enabled:true,...changes});
const order=()=>({id:'WITHDRAW-DEMO',business:'withdraw',merchant:'演示商户',merchantNo:'M-DEMO',currency:'TRX',chain:'TRON',outAmount:200,balance:1500,recipient:'TDEMORecipient',status:'待处理',confirm:'已确认',third:'未提交',getChannels:()=>a.eligible(a.read())});
test('通道管理与商户下分读取同一数据规则，脚本可解析',()=>{assert.equal(model(source),model(withdraw));for(const s of [source,withdraw])for(const [,script]of s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script)});
test('仅开启的下分通道可选，普通通道即使开启也不入选',()=>{const s=a.seed(),choices=a.eligible(s);assert.equal(s.channels.length,41);assert.deepEqual(Array.from(choices,c=>c.id),['PC-DEMO-001','PC-DEMO-002']);assert.ok(choices.some(c=>c.provider!=='新万能通道商'));assert.ok(!choices.some(c=>c.id==='PC-DEMO-003'));assert.equal(a.filter(s,{category:'下分'}).length,3);assert.equal(a.filter(s,{category:'下分',enabled:'false'}).length,1);assert.equal(a.filter(s,{keyword:'DEMO-CHANNEL-001'}).length,1)});
test('修改状态后下分候选立即更新，通道ID和用途保持',()=>{
  storage.clear();
  const state = a.seed();
  const channel = a.save(state, null, form());
  a.write(state);
  assert.ok(a.eligible(a.read()).some(c => c.id === channel.id));

  a.save(state, channel.id, form({enabled:false}));
  a.write(state);
  assert.ok(!a.eligible(a.read()).some(c => c.id === channel.id));

  a.save(state, channel.id, form({category:undefined}));
  a.write(state);
  assert.ok(a.eligible(a.read()).some(c => c.id === channel.id));
  assert.equal(channel.category, '下分');

  state.channels = state.channels.filter(c => c.id !== channel.id);
  a.write(state);
  assert.ok(!a.eligible(a.read()).some(c => c.id === channel.id));
});
test('必填项或权重无效时不部分新增或修改原通道',()=>{for(const change of [{name:''},{provider:''},{interface:''},{category:'银行卡'},{category:'普通',productType:''},{productType:'missing'},{weight:0},{weight:10},{weight:1.5},{enabled:undefined}]){const s=a.seed(),before=JSON.stringify(s);assert.throws(()=>a.save(s,null,form(change)));assert.equal(JSON.stringify(s),before);assert.throws(()=>a.save(s,s.channels[0].id,form(change)));assert.equal(JSON.stringify(s),before)}});
test('下分确认必须选择有效通道，保存选择通道而非固定新万能，重复提交不修改结果',()=>{storage.clear();a.write(a.seed());const o=order(),before=JSON.stringify(o);for(const c of [undefined,{...a.seed().channels[0],enabled:false},a.seed().channels[3]]){assert.equal(a.submit(o,c),false);assert.equal(JSON.stringify(o),before)}const c=a.select(o,'PC-DEMO-002');assert.ok(c);assert.equal(a.submit(o,c),true);assert.equal(o.channelId,c.id);assert.equal(o.channelName,c.name);assert.equal(o.channelProvider,c.provider);assert.equal(o.currency,'TRX');assert.equal(o.outAmount,200);const after=JSON.stringify(o);assert.equal(a.submit(o,a.seed().channels[0]),false);assert.equal(JSON.stringify(o),after)});
test('弹窗打开后通道停用或删除，再次核对时不可提交；无启用通道时显示空候选',()=>{storage.clear();const s=a.seed();a.write(s);const o=order();assert.ok(a.select(o,'PC-DEMO-002'));s.channels[1].enabled=false;a.write(s);assert.equal(a.select(o,'PC-DEMO-002'),undefined);s.channels=s.channels.filter(c=>c.id!=='PC-DEMO-001');a.write(s);assert.equal(a.select(o,'PC-DEMO-001'),undefined);assert.ok(a.body(o).includes('暂无已开启的下分通道'));assert.equal(o.status,'待处理');assert.equal(o.third,'未提交')});
test('候选下拉从空选项开始，保留两种已开启下分通道，不含普通与停用项',()=>{storage.clear();a.write(a.seed());const html=a.body(order());assert.ok(html.includes('<option value="">请选择下分代付通道</option>'));assert.ok(html.includes('新万能下分演示通道'));assert.ok(html.includes('远航下分演示通道'));assert.ok(!html.includes('北辰停用下分演示通道'));assert.ok(!html.includes('普通代付演示通道'));assert.ok(!html.includes('确认提交新万能出款'))});

test('产品选择独立于通道用途，筛选可组合，原有存储可继续读取', () => {
  storage.clear();
  const previous = a.seed();
  for (const channel of previous.channels) delete channel.productType;
  previous.channels.push({ id:'PC-DEMO-042', name:'旧版自定义通道', category:'下分', enabled:true });
  previous.nextId = 43;
  a.write(previous);
  const state = a.read();
  const legacy = state.channels.at(-1);
  assert.equal(Object.hasOwn(legacy, 'productType'), false);
  assert.equal(a.seed().channels[0].productType, 'DEMO-CRYPTO');
  assert.equal(a.filter(state, { productType:'DEMO-CRYPTO', category:'下分' }).length, 0);
  a.setProduct(state, legacy.id, 'DEMO-BANK');
  assert.equal(legacy.productType, 'DEMO-BANK');
  assert.equal(legacy.category, '下分');
  assert.equal(legacy.enabled, true);
  assert.ok(a.eligible(state).some(channel => channel.id === legacy.id));
  assert.equal(a.filter(state, { productType:'DEMO-BANK', category:'下分' }).length, 1);
  a.write(state);
  const restored = a.read();
  assert.equal(restored.channels.at(-1).productType, 'DEMO-BANK');
  assert.equal(Object.hasOwn(restored.channels[0], 'productType'), false);
  assert.equal(Object.hasOwn(JSON.parse([...storage.values()][0]).channels[0], 'productType'), false);
});

test('下分可不绑定产品并保持出款资格，普通通道必须绑定产品', () => {
  storage.clear();
  const state = a.seed();
  const channel = a.save(state, null, form({productType:''}));
  a.write(state);

  const unbound = a.read().channels.find(current => current.id === channel.id);
  assert.equal(unbound.productType, '');
  assert.equal(a.select(order(), channel.id)?.id, channel.id);

  assert.throws(() => a.save(state, null, form({category:'普通', productType:''})), /请选择代付类型/);
  a.setProduct(state, channel.id, 'DEMO-CRYPTO');
  a.setProduct(state, channel.id, '');
  assert.equal(channel.productType, '');
  assert.equal(channel.category, '下分');

  const ordinary = a.save(state, null, form({category:'普通'}));
  assert.throws(() => a.setProduct(state, ordinary.id, ''), /请选择代付类型/);
  assert.equal(ordinary.productType, 'DEMO-CRYPTO');
  assert.ok(!a.eligible(state).some(candidate => candidate.id === ordinary.id));
});

test('用途锁定后两个方向都不能更改，原通道数据保持完整', () => {
  const state = a.seed();
  const ordinary = a.save(state, null, form({category:'普通'}));
  const withdrawal = a.save(state, null, form({productType:''}));
  for (const [channel, category] of [[ordinary, '下分'], [withdrawal, '普通']]) {
    const snapshot = JSON.stringify(state);
    assert.throws(
      () => a.save(state, channel.id, form({name:'试图变更用途', category})),
      /通道类型创建后不可修改/,
    );
    assert.equal(JSON.stringify(state), snapshot);
  }
});
