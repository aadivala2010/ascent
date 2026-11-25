import { Box, Layers3, Search, Section, Split, Waypoints } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAscentStore } from '../app/store';
import { catalog, syntheticPresets } from '../data/catalog';
import { idealDeltaV } from '../physics/orbital';
import { VehicleScene, type CadMode } from '../rendering/VehicleScene';
import { Panel } from '../ui/Panel';
import { formatNumber } from '../ui/format';

function presetDeltaV(vehicle: ReturnType<typeof useAscentStore.getState>['activeVehicle']): number | null {
  if (!vehicle.stages.length) return null;
  let total = 0;
  for (let index = 0; index < vehicle.stages.length; index += 1) {
    const carried = vehicle.payload_kg + vehicle.stages.slice(index + 1).reduce((sum, stage) => sum + stage.dryMass_kg + stage.propellantMass_kg, 0);
    const stage = vehicle.stages[index];
    const initial = carried + stage.dryMass_kg + stage.propellantMass_kg;
    total += idealDeltaV(initial, initial - stage.propellantMass_kg, stage.ispVac_s);
  }
  return total;
}

export function VehicleDesign() {
  const { selectedVisualId, selectVisual, activeVehicle, selectPreset, patchVehicle, setWorkspace } = useAscentStore();
  const [mode, setMode] = useState<CadMode>('solid');
  const [query, setQuery] = useState('');
  const all = useMemo(() => [
    ...syntheticPresets.map((vehicle) => ({ id: vehicle.id, name: vehicle.name, status: vehicle.status, simulationReady: true })),
    ...catalog.map((vehicle) => ({ id: vehicle.id, name: vehicle.name, status: vehicle.confidence, simulationReady: false })),
  ].filter((vehicle) => vehicle.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const catalogEntry = catalog.find((vehicle) => vehicle.id === selectedVisualId);
  const presetEntry = syntheticPresets.find((vehicle) => vehicle.id === selectedVisualId) ?? (selectedVisualId === 'custom' ? activeVehicle : null);
  const dv = presetDeltaV(activeVehicle);
  const updateStage = (index: number, key: keyof (typeof activeVehicle.stages)[number], value: number) => {
    const stages = activeVehicle.stages.map((stage, stageIndex) => stageIndex === index ? { ...stage, [key]: value } : stage);
    patchVehicle({ stages });
  };
  const visualId = catalogEntry?.geometry ?? (presetEntry?.id === 'orbital-test' ? 'dragon' : presetEntry ? 'custom' : selectedVisualId);
  return (
    <div className="workspace workspace--vehicle">
      <aside className="workspace__side workspace__side--left">
        <Panel title="Vehicle library" icon={<Layers3 size={15} />}>
          <label className="search-field"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vehicles" /></label>
          <div className="catalog-list">
            {all.map((vehicle) => <button key={vehicle.id} className={selectedVisualId === vehicle.id ? 'is-active' : ''} onClick={() => vehicle.simulationReady ? selectPreset(vehicle.id) : selectVisual(vehicle.id)}><span className="rocket-mini">♢</span><span><strong>{vehicle.name}</strong><small>{vehicle.simulationReady ? 'Simulation ready · synthetic' : 'Catalog exterior · read-only'}</small></span></button>)}
          </div>
        </Panel>
        <Panel title="Model status"><p className={`status-line ${presetEntry ? 'is-success' : ''}`}><span className={`status-dot ${presetEntry ? 'status-dot--ok' : ''}`} />{presetEntry ? 'Complete synthetic input' : 'Published summary only'}</p><p className="muted-copy">Real vehicle facts are never used as hidden flight-model inputs.</p></Panel>
      </aside>
      <main className="workspace__viewport vehicle-viewport">
        <VehicleScene vehicleId={visualId} mode={mode} height={activeVehicle.height_m} diameter={activeVehicle.diameter_m} />
        <div className="viewport-heading"><span className="eyebrow">Vehicle Design</span><h1>{catalogEntry?.name ?? presetEntry?.name ?? activeVehicle.name}</h1><p>{catalogEntry ? 'Procedural exterior approximation · catalog facts only' : activeVehicle.status}</p></div>
        <div className="cad-toolbar" role="group" aria-label="CAD rendering mode">
          <button className={mode === 'solid' ? 'is-active' : ''} onClick={() => setMode('solid')}><Box size={15} /> Solid</button>
          <button className={mode === 'wireframe' ? 'is-active' : ''} onClick={() => setMode('wireframe')}><Waypoints size={15} /> Wireframe</button>
          <button className={mode === 'cutaway' ? 'is-active' : ''} onClick={() => setMode('cutaway')}><Section size={15} /> Cutaway</button>
          <button className={mode === 'exploded' ? 'is-active' : ''} onClick={() => setMode('exploded')}><Split size={15} /> Exploded</button>
        </div>
      </main>
      <aside className="workspace__side workspace__side--right">
        {catalogEntry ? <>
          <Panel title="Published facts"><dl className="data-list">{Object.entries(catalogEntry.publishedFacts).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{typeof value === 'number' ? value.toLocaleString() : value}</dd></div>)}</dl><p className="notice">{catalogEntry.confidence}</p><a className="text-link" href={catalogEntry.source} target="_blank" rel="noreferrer">Open cited source</a></Panel>
          <Panel title="Simulation availability"><p className="muted-copy">This catalog entry lacks a verified complete stage model and cannot be simulated.</p><button className="button button--primary" onClick={() => selectPreset('two-stage')}>Use separate ASCENT T2 trainer</button></Panel>
        </> : <>
          <Panel title="Editable synthetic parameters">
            <label className="field"><span>Name</span><input value={activeVehicle.name} onChange={(event) => patchVehicle({ name: event.target.value })} /></label>
            <div className="field-grid"><label className="field"><span>Height (m)</span><input type="number" min="0.1" value={activeVehicle.height_m} onChange={(event) => patchVehicle({ height_m: Number(event.target.value) })} /></label><label className="field"><span>Diameter (m)</span><input type="number" min="0.1" value={activeVehicle.diameter_m} onChange={(event) => patchVehicle({ diameter_m: Number(event.target.value) })} /></label></div>
            <label className="field"><span>Payload (kg)</span><input type="number" min="0" value={activeVehicle.payload_kg} onChange={(event) => patchVehicle({ payload_kg: Number(event.target.value) })} /></label>
          </Panel>
          <Panel title="Advanced stage inputs">
            <div className="stage-editor">{activeVehicle.stages.map((stage,index)=><details key={index} open={index===0}><summary>Stage {index+1}</summary><div className="field-grid"><label className="field"><span>Dry mass (kg)</span><input type="number" min="0" value={stage.dryMass_kg} onChange={event=>updateStage(index,'dryMass_kg',Number(event.target.value))}/></label><label className="field"><span>Propellant (kg)</span><input type="number" min="0" value={stage.propellantMass_kg} onChange={event=>updateStage(index,'propellantMass_kg',Number(event.target.value))}/></label><label className="field"><span>Sea thrust (N)</span><input type="number" min="0" value={stage.thrustSea_N} onChange={event=>updateStage(index,'thrustSea_N',Number(event.target.value))}/></label><label className="field"><span>Vac thrust (N)</span><input type="number" min="0" value={stage.thrustVac_N} onChange={event=>updateStage(index,'thrustVac_N',Number(event.target.value))}/></label><label className="field"><span>Sea Isp (s)</span><input type="number" min="0.1" value={stage.ispSea_s} onChange={event=>updateStage(index,'ispSea_s',Number(event.target.value))}/></label><label className="field"><span>Vac Isp (s)</span><input type="number" min="0.1" value={stage.ispVac_s} onChange={event=>updateStage(index,'ispVac_s',Number(event.target.value))}/></label><label className="field"><span>Drag Cd</span><input type="number" min="0" step="0.01" value={stage.dragCoefficient} onChange={event=>updateStage(index,'dragCoefficient',Number(event.target.value))}/></label><label className="field"><span>Height fraction</span><input type="number" min="0.05" max="1" step="0.05" value={stage.visualHeightFraction} onChange={event=>updateStage(index,'visualHeightFraction',Number(event.target.value))}/></label></div></details>)}</div>
            <div className="inline-actions"><button className="button" onClick={()=>patchVehicle({stages:[...activeVehicle.stages,{dryMass_kg:100,propellantMass_kg:300,thrustSea_N:6000,thrustVac_N:7000,ispSea_s:265,ispVac_s:290,dragCoefficient:.4,visualHeightFraction:.25}]})}>Add generic stage</button>{activeVehicle.stages.length>0&&<button className="button" onClick={()=>patchVehicle({stages:activeVehicle.stages.slice(0,-1)})}>Remove last</button>}</div>
          </Panel>
          <Panel title="Computed ideal performance"><dl className="data-list"><div><dt>Stages</dt><dd>{activeVehicle.stages.length}</dd></div><div><dt>Wet mass</dt><dd>{formatNumber(activeVehicle.payload_kg + activeVehicle.stages.reduce((sum, stage) => sum + stage.dryMass_kg + stage.propellantMass_kg, 0), 0)} kg</dd></div><div><dt>Ideal vacuum Δv</dt><dd>{dv ? `${formatNumber(dv / 1000, 2)} km/s` : 'N/A'}</dd></div></dl><p className="notice">Ideal rocket-equation result only; excludes gravity, drag, steering and reserves.</p><button className="button button--primary" onClick={() => setWorkspace('plan')}>Configure scenario</button></Panel>
        </>}
      </aside>
      <div className="workspace__bottom vehicle-bottom"><div><span className="eyebrow">Geometry status</span><strong>Procedural exterior · {mode}</strong></div><div><span className="eyebrow">Coordinate frame</span><strong>+Y vehicle axis · meters</strong></div><div><span className="eyebrow">Scientific boundary</span><strong>Visual approximation, not manufacturing data</strong></div></div>
    </div>
  );
}
