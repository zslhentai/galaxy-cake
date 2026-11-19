// Both renderers share the same composition, hues, orbit paths and sizes.
const decoration = (() => {
  const tau = Math.PI * 2;
  let seed = 137;
  const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const palette = ['#efc679','#609eda','#d28a9e','#63bcae','#d99663','#aa98cc','#dfc6a6','#b25b7c','#5d78c3'];
  const piping = ['#ead0b7','#d5b6a6','#c9abc8','#b9afcc','#e4c3ab','#dcaebe'];
  const ivory = '#e3c9ad';

  const orbit = Array.from({length: 346}, (_, i) => {
    const shape = i < 18 ? 'star' : i < 38 ? 'gem' : i < 47 ? 'light' : i % 5 === 0 ? 'chip' : 'dust';
    const accent = i < 5;
    const y = .03 + 3.18 * Math.pow(random(), .85);
    const envelope = Math.sqrt(Math.max(.07,1 - ((y - 1.48) / 1.78) ** 2));
    const radius = (1.1 + .62 * random()) * envelope + (accent ? .32 : .16);
    const sizeSample = random();
    const sizes = {
      star: accent ? .055 + .029 * sizeSample : .021 + .034 * sizeSample ** 1.6,
      gem: .019 + .029 * sizeSample,
      light: .018 + .022 * sizeSample,
    };
    return {
      y,radius,a:tau*random(),size:sizes[shape] ?? .004 + .021 * sizeSample ** 2,shape,
      color:shape === 'light' ? ['#eec992','#c7dbf4',ivory][i%3] : accent ? [palette[0],ivory,palette[1]][i%3] : palette[i%palette.length],
      phase:tau*random(),speed:.028+.021*random(),lift:.026+.046*random()
    };
  });

  // Compact the larger shapes as they pass in front of the candle or glaze.
  function orbitScale(shape, angle) {
    return shape === 'star' ? 1 - .48 * Math.max(0, Math.cos(angle)) ** 3 : 1;
  }

  const candy = Array.from({length: 108}, (_,i) => {
    const radius = .21 + .65 * random();
    // Two spiral trails follow the painted folds of the buttercream.
    let angle = (radius - .17) / .69 * 1.35 * tau + i % 2 * Math.PI + (random() - .5) * .88;
    const nearMoon = Math.hypot(radius * Math.sin(angle) - .49, radius * Math.cos(angle) + .064);
    if (nearMoon < .20) angle += .52;
    const shape = i < 12 ? 'star' : i < 56 ? 'chip' : i < 84 ? 'pearl' : 'dust';
    const size = (shape === 'star' ? .031 : shape === 'chip' ? .023 : .011) * (.78 + .9 * random());
    const y = 1.385 + .112 * Math.sqrt(1 - (radius / .992) ** 2);
    return {radius,angle,y:y + .003 + size * .24,size,shape,
      color:shape === 'pearl' ? ivory : palette[i%palette.length],phase:tau*random()};
  });
  const plate = Array.from({length: 16}, (_,i) => ({
    radius:1.09+.3*random(),angle:tau*random(),y:.091,size:.013+.028*random(),
    phase:tau*random(),shape:i%5===0?'star':'chip',color:palette[i%palette.length]
  }));
  return {piping,orbit,orbitScale,candy,plate};
})();
