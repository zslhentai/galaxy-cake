// Both renderers share the same composition, hues, orbit paths and sizes.
const decoration = (() => {
  const tau = Math.PI * 2;
  let seed = 137;
  const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const palette = ['#fadc66','#24a7fc','#f57ca8','#4edbc5','#f4a455','#bf9df7','#fff1cc','#e95273','#377be3'];
  const ivory = '#fff0d7';

  const orbit = Array.from({length: 346}, (_, i) => {
    const shape = i < 27 ? 'star' : i < 49 ? 'gem' : i < 59 ? 'light' : i % 4 === 0 ? 'chip' : 'dust';
    const y = .03 + 3.18 * Math.pow(random(), .85);
    const envelope = Math.sqrt(Math.max(.07,1 - ((y - 1.48) / 1.78) ** 2));
    const radius = (1.08 + .6 * random()) * envelope + .17;
    let size;
    if (shape === 'star') size = i < 8 ? .084 + .031 * random() : .032 + .056 * random() ** 1.6;
    else if (shape === 'gem') size = .027 + .034 * random();
    else if (shape === 'light') size = .023 + .027 * random();
    else size = .006 + .023 * random() ** 2;
    return {
      y,radius,a:tau*random(),size,shape,
      color:shape === 'light' ? ['#ffdc9a','#d7edff',ivory][i%3] : i < 8 ? ['#ffdd69','#ffecca','#8bdafb','#f4ae53'][i%4] : palette[i%palette.length],
      phase:tau*random(),speed:.028+.021*random(),lift:.026+.046*random()
    };
  });
  const candy = Array.from({length: 169}, (_,i) => {
    const radius = .14 + .858 * Math.sqrt(random()), angle = random() * tau;
    const rim = radius > .85;
    const shape = i < 23 ? 'star' : i < 95 ? 'chip' : i < 126 ? 'pearl' : 'dust';
    const size = (shape === 'star' ? .044 : shape === 'chip' ? .035 : .014) * (.75+1.38*random());
    return {radius, angle, y:1.45 + .11 * Math.sqrt(Math.max(0,1-radius*radius))+(rim?.014:0),
      size,shape,color:shape==='pearl'?ivory:palette[i%palette.length],phase:tau*random()};
  });
  const plate = Array.from({length:25}, (_, i) => ({
    radius:1.05+.35*random(),angle:tau*random(),y:.091,size:.016+.045*random(),
    phase:tau*random(),shape:i%6===0?'star':'chip',color:palette[i%palette.length]
  }));
  return {palette,orbit,candy,plate};
})();
