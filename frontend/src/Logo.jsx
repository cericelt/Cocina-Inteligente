import apilado from './assets/logo/apilado.svg';
import palabraVerde from './assets/logo/palabra-verde.svg';
import palabraCrema from './assets/logo/palabra-crema.svg';
import horizontal from './assets/logo/horizontal.svg';
import horizontalSobreVerde from './assets/logo/horizontal-sobre-verde.svg';

// Logos de Plato a Plato.
//  - "apilado": el logo (ícono + nombre debajo)  -> pantalla de entrada
//  - "palabra": el nombre con los platos en las "o" -> cuando solo aparece el texto "Plato a Plato"
//  - "horizontal": ícono + letras, juntos        -> barra de navegación (sobre verde) o fondo claro
const FUENTES = {
  apilado,
  palabra: palabraVerde,
  'palabra-crema': palabraCrema,
  horizontal,
  'horizontal-sobre-verde': horizontalSobreVerde,
};

export default function Logo({ tipo = 'palabra', alto = 40, style }) {
  return <img src={FUENTES[tipo]} alt="Plato a Plato" height={alto} style={{ display: 'block', ...style }} />;
}
