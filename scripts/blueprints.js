// Line drawings for the Engineering blueprint, one per project, each in a
// 420 × 320 box. Classes: bp-l solid lines (they "plot in" on first view, which
// is what pathLength="1" is for), bp-thin construction lines, bp-center
// dash-dot center lines, bp-dim dimension lines with arrowheads, bp-t labels.
// Arrowheads come from the #bp-arrow marker defined once on the sheet.
(() => {
  const r2 = (n) => Math.round(n * 10) / 10;
  const polar = (cx, cy, r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))];
  };
  const L = (d) => `<path class="bp-l" pathLength="1" d="${d}"/>`;
  const C = (cx, cy, r) => `<circle class="bp-l" pathLength="1" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const thin = (d) => `<path class="bp-thin" d="${d}"/>`;
  const center = (d) => `<path class="bp-center" d="${d}"/>`;
  const dim = (d) => `<path class="bp-dim" d="${d}" marker-start="url(#bp-arrow)" marker-end="url(#bp-arrow)"/>`;
  const arrow = (d) => `<path class="bp-dim" d="${d}" marker-end="url(#bp-arrow)"/>`;
  const T = (x, y, text, anchor = 'middle', size = 11) =>
    `<text class="bp-t" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${text}</text>`;
  const svg = (body) => `<svg class="bp-drawing" viewBox="0 0 420 320" aria-hidden="true">${body}</svg>`;

  // Axial turbine: rotor disk from the front, a blade section, and a velocity triangle.
  function turbine() {
    const blades = Array.from({ length: 24 }, (_, i) => {
      const a = i * 15;
      const [x1, y1] = polar(140, 160, 42, a);
      const [qx, qy] = polar(140, 160, 82, a + 3);
      const [x2, y2] = polar(140, 160, 112, a + 13);
      return L(`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`);
    }).join('');
    return svg(`
      ${center('M10 160H272M140 30V292')}
      ${C(140, 160, 118)}${C(140, 160, 38)}${C(140, 160, 12)}
      ${blades}
      ${thin('M22 160V18M258 160V18')}
      ${dim('M22 24H258')}${T(140, 16, 'Ø 236')}
      ${L('M300 122C318 72 378 70 406 96C386 92 340 102 300 122Z')}
      ${center('M292 104L414 96')}
      ${T(354, 150, 'BLADE · MEAN', 'middle', 9)}
      ${arrow('M296 280H404')}${arrow('M296 280L336 206')}${L('M336 206L404 280')}
      ${T(350, 298, 'U', 'middle', 10)}${T(304, 238, 'C₂', 'middle', 10)}${T(384, 236, 'W₂', 'middle', 10)}
    `);
  }

  // Centrifugal governor: flexible legs between two collars on a shaft, inside its housing.
  function governor() {
    const leg = (s) =>
      L(`M${210 + s * 24} 80C${210 + s * 90} 110 ${210 + s * 90} 200 ${210 + s * 24} 230`) +
      thin(`M${210 + s * 20} 84C${210 + s * 78} 114 ${210 + s * 78} 196 ${210 + s * 20} 226`);
    return svg(`
      ${center('M210 6V314')}
      <path class="bp-thin bp-hidden" d="M80 48H340V262H80Z"/>
      ${T(332, 42, 'HOUSING', 'end', 9)}
      ${L('M202 30H218V290H202Z')}
      ${L('M186 60H234V80H186Z')}${L('M186 230H234V250H186Z')}
      ${leg(-1)}${leg(1)}
      ${C(129, 155, 9)}${C(291, 155, 9)}
      ${L('M150 290H270V302H150Z')}
      <path class="bp-dim" d="M180 22A30 8 0 1 0 240 22" marker-end="url(#bp-arrow)"/>
      ${T(252, 18, 'ω', 'start', 13)}
      ${thin('M186 80H52M186 230H52')}
      ${dim('M60 80V230')}${T(46, 159, 'L₁', 'middle', 11)}
      ${thin('M300 155H372')}${T(378, 159, 't', 'start', 11)}
      ${T(210, 318, 'MIRAGE 250 CVM', 'middle', 9)}
    `);
  }

  // Quadcopter from above: body, four arms, rotor guards and props.
  function drone() {
    const rotors = [
      [110, 70, 25],
      [310, 70, 155],
      [110, 250, -25],
      [310, 250, 205],
    ]
      .map(([x, y, a]) => {
        const [px1, py1] = polar(x, y, 44, a);
        const [px2, py2] = polar(x, y, 44, a + 180);
        return `${C(x, y, 52)}${C(x, y, 8)}<circle class="bp-thin bp-hidden" cx="${x}" cy="${y}" r="44"/>${L(`M${px1} ${py1}L${px2} ${py2}`)}`;
      })
      .join('');
    return svg(`
      ${center('M210 6V314M6 160H414')}
      ${L('M176 136L120 82M244 136L300 82M176 184L120 238M244 184L300 238')}
      ${thin('M182 130L128 76M238 130L292 76M182 190L128 244M238 190L292 244')}
      <rect class="bp-l" pathLength="1" x="170" y="128" width="80" height="64" rx="14"/>
      ${L('M200 128V116H220V128')}
      ${rotors}
      ${dim('M64 296L356 24')}
      <text class="bp-t" x="0" y="0" font-size="11" text-anchor="middle" transform="translate(222 150) rotate(-43)">WHEELBASE</text>
    `);
  }

  // The Photon 2 light meter, with a sketch of the sensor wired to the board.
  function lightmeter() {
    const ticks = Array.from({ length: 9 }, (_, i) => {
      const a = 200 + i * 17.5;
      const [x1, y1] = polar(120, 124, 46, a);
      const [x2, y2] = polar(120, 124, i % 2 ? 52 : 56, a);
      return L(`M${x1} ${y1}L${x2} ${y2}`);
    }).join('');
    const dial = Array.from({ length: 8 }, (_, i) => {
      const [x1, y1] = polar(98, 244, 30, -150 + i * 30);
      const [x2, y2] = polar(98, 244, 35, -150 + i * 30);
      return thin(`M${x1} ${y1}L${x2} ${y2}`);
    }).join('');
    return svg(`
      <rect class="bp-l" pathLength="1" x="40" y="26" width="160" height="276" rx="18"/>
      <rect class="bp-l" pathLength="1" x="58" y="46" width="124" height="88" rx="8"/>
      ${ticks}
      ${L('M120 124L96 80')}${C(120, 124, 4)}
      <rect class="bp-l" pathLength="1" x="58" y="148" width="124" height="44" rx="4"/>
      ${T(68, 166, 'EV 12.3', 'start', 10)}${T(68, 183, '1/60 s', 'start', 12)}
      ${C(98, 244, 26)}${L('M98 244L98 222')}${dial}
      ${C(160, 222, 6)}
      <rect class="bp-l" pathLength="1" x="144" y="250" width="32" height="18" rx="4"/>
      ${T(98, 292, 'f/1.4–16', 'middle', 9)}
      <rect class="bp-l" pathLength="1" x="262" y="52" width="76" height="52" rx="3"/>
      ${T(300, 82, 'BH1750', 'middle', 10)}
      ${thin('M276 104V118M292 104V118M308 104V118M324 104V118')}
      <rect class="bp-l" pathLength="1" x="252" y="196" width="146" height="88" rx="4"/>
      ${T(325, 244, 'PHOTON 2', 'middle', 11)}
      ${L('M276 118V150H232V230H252M292 118V160H392V196M308 118V140H360V196M324 118V128H408V240H398')}
      ${C(232, 150, 3)}${C(392, 160, 3)}
      ${thin('M200 140H232')}
    `);
  }

  // Shear banding: a stress–strain curve beside a block of material being sheared.
  function shear() {
    const verticals = [0, 1, 2, 3, 4].map((i) => thin(`M${270 + i * 30} 250L${290 + i * 30} 120`)).join('');
    const horizontals = [1, 2, 3].map((i) => {
      const y = 250 - i * 32.5;
      const dx = (i * 32.5 * 20) / 130;
      return thin(`M${270 + dx} ${y}H${390 + dx}`);
    }).join('');
    return svg(`
      ${arrow('M40 272V36')}${arrow('M38 270H236')}
      ${T(28, 44, 'σ', 'middle', 13)}${T(232, 290, 'γ', 'middle', 13)}
      ${L('M40 270C70 150 95 92 120 86C140 82 150 120 170 140S214 150 232 150')}
      ${center('M40 86H120M120 86V270')}
      ${T(48, 78, 'σy', 'start', 11)}
      ${L('M270 250H390L410 120H290Z')}
      ${verticals}${horizontals}
      <path class="bp-l bp-band" pathLength="1" d="M262 205L420 168"/>
      ${arrow('M300 104H404')}${arrow('M390 270H276')}
      ${T(340, 300, 'SHEAR BAND', 'middle', 9)}
    `);
  }

  window.BLUEPRINTS = { turbine, governor, drone, lightmeter, shear };
})();
