const doc = stroxy(document);
const win = stroxy(window);

/**
 * 1. Link click stream example
 */
const linkStream = doc.querySelectorAll('.link').add('click');

const isPrimary = linkStream
  .pipe(e => (e.preventDefault(), e.target.className))
  .pipe(className => /\bprimary\b/.test(className));

const className = linkStream
  .pipe(e => (e.preventDefault(), e.target.className))
  .pipe(className => className.replace(/link/, '').trim());

isPrimary.onValue(value => console.log('1. Link is primary:', value));
className.onValue(value => console.log('1. Classname:', value));

/**
 * 2. Single click example
 */
const secondaryStream = doc.querySelector('.secondary').add('click');

const isSecondary = secondaryStream
 .pipe(({currentTarget}) => currentTarget);

isSecondary.onValue(value => console.log('2. Secondary has been clicked. Node:', value));

/**
 * 3. Clear stream example
 */
const clearStream = doc.querySelectorAll('.clear').add('click');

clearStream.onValue(value => (console.log('3. Clear listener for .link clicks'), doc.querySelectorAll('.link').remove('click', linkStream)));

/**
 * 4. Interval example
 */
const intervalStream = win.setInterval(1000);

let counter = 0;
const counterVal = intervalStream
  .pipe(_ => ++counter);

const counterLog = intervalStream
  .pipe(_ => console.log('interval'));

counterVal.onValue(value => { console.log('4. Counter:', value); if (value >= 10) { win.clearInterval(intervalStream); } });