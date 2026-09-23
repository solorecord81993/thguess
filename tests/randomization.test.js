import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { THAILAND_POOL } from '../lib/thailand-pool.js'
import { verifyRounds } from '../api/score.js'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const source = html.slice(html.indexOf('    const legacySpots='), html.indexOf('    function streetViewUrl'))
function app(storage = new Map()) {
  const context = vm.createContext({localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}})
  vm.runInContext(source, context)
  context.pool=THAILAND_POOL
  vm.runInContext('allSpots=pool',context)
  return {context, storage, draw:(bangkok,seed)=>vm.runInContext(`balancedSpots(${bangkok ? "legacySpots.filter(s=>s.region==='bangkok')" : 'allSpots'},${seed}).map(spotKey)`,context)}
}

for (const [name,bangkok,size] of [['Thailand',false,3027],['Bangkok',true,16]]) {
  test(`${name}: consume every location before repeating across multiple cycles`,()=>{
    const run=app(),usage=new Map()
    for(let game=0;game<Math.ceil(size*2/5);game++){
      const spots=run.draw(bangkok,game+1)
      assert.equal(spots.length,5)
      assert.equal(new Set(spots).size,5)
      for(const key of spots){
        const minimum=usage.size<size?0:Math.min(...usage.values())
        assert.equal(usage.get(key)||0,minimum)
        usage.set(key,(usage.get(key)||0)+1)
      }
    }
  })
}
test('reload retains history and modes share location counts',()=>{
  const run=app(),first=run.draw(true,1)
  const reloaded=app(run.storage),next=reloaded.draw(false,2)
  assert.equal(next.some(key=>first.includes(key)),false)
  const bangkok=reloaded.draw(true,3)
  assert.equal(bangkok.some(key=>first.includes(key)),false)
})
test('dataset is unique and every location is accepted by server scoring',()=>{
  assert.equal(THAILAND_POOL.length,3027)
  for(const field of ['name','panoId']) assert.equal(new Set(THAILAND_POOL.map(s=>s[field])).size,3027)
  assert.equal(new Set(THAILAND_POOL.map(s=>`${s.lat.toFixed(4)},${s.lng.toFixed(4)}`)).size,3027)
  for(let i=0;i<THAILAND_POOL.length;i+=5){
    const batch=Array.from({length:5},(_,j)=>THAILAND_POOL[(i+j)%THAILAND_POOL.length])
    assert.ok(verifyRounds(batch.map(s=>({spotName:s.name,guess:{lat:s.lat,lng:s.lng}}))).every(r=>r.score===5000))
  }
})
test('daily stays deterministic and does not alter normal-game history',()=>{
  const run=app()
  run.draw(false,1)
  const before=run.storage.get('thguessLocationUsageV1')
  const a=vm.runInContext("getRoundSpots('daily').map(spotKey).join('|')",run.context)
  const b=vm.runInContext("getRoundSpots('daily').map(spotKey).join('|')",run.context)
  assert.equal(a,b)
  assert.equal(run.storage.get('thguessLocationUsageV1'),before)
})
test('legacy recent history is migrated and malformed storage is tolerated',()=>{
  const initial=app(),old=initial.draw(false,1)
  const storage=new Map([['thguessRecentSpots',JSON.stringify(old)],['thguessLocationUsageV1','broken']])
  const run=app(storage)
  assert.equal(run.draw(false,2).some(key=>old.includes(key)),false)
})
