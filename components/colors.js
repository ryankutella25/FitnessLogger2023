
export var COLORS = {
    white: '#fff',
    black: '#000',
    background: '#0C0C1C',
    primary: '#fff',
    secondaryText: '#999',
    primaryBorder: '#000',
    tertiary: '#1fa',
    itemBackground: 'rgb(13,27,43)',
    itemBackground2: 'rgb(11,43,57)',
    itemBackground3: 'rgb(15,59,71)',
  }

export const setColors = (text, color) => {
  if(text=='tertiary'){
    console.log(color)
    COLORS.tertiary= color;
  }
  if(text=='primary'){
    console.log(color)
    COLORS.background= color;
  }
  if(text=='secondary'){
    console.log(color)
    COLORS.itemBackground= color;
  }
  if(text=='text'){
    console.log(color)
    COLORS.primary= color;
  }
}

export const resetColors = () => {
  COLORS.tertiary= '#1fa';
  COLORS.background= '#0C0C1C';
  COLORS.itemBackground= 'rgb(13,27,43)';
  COLORS.primary= '#fff';
}