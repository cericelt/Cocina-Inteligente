-- Catálogo de Cocina Inteligente: categorías, alimentos, recetas e ingredientes.
-- Valores nutricionales referenciales (por 100 g), a revisar por la autora.
-- Ejecutar DESPUÉS de 01_esquema.sql, con la base cocina_inteligente seleccionada.

USE cocina_inteligente;
SET NAMES utf8mb4;

INSERT INTO categorias_alimentos (nombre) VALUES
  ('Cereales y derivados'),
  ('Legumbres'),
  ('Verduras'),
  ('Frutas'),
  ('Carnes'),
  ('Aves'),
  ('Pescados y mariscos'),
  ('Huevos'),
  ('Lácteos'),
  ('Aceites y grasas'),
  ('Frutos secos'),
  ('Tubérculos'),
  ('Condimentos y salsas'),
  ('Panadería');

INSERT INTO alimentos (nombre, categoria_id, unidad_medida, kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g, gramos_por_unidad) VALUES
  ('Arroz', (SELECT id FROM categorias_alimentos WHERE nombre='Cereales y derivados'), 'g', 360, 7.0, 79.0, 0.6, NULL),
  ('Fideos', (SELECT id FROM categorias_alimentos WHERE nombre='Cereales y derivados'), 'g', 350, 12.0, 72.0, 1.5, NULL),
  ('Avena', (SELECT id FROM categorias_alimentos WHERE nombre='Cereales y derivados'), 'g', 370, 13.0, 66.0, 7.0, NULL),
  ('Pan marraqueta', (SELECT id FROM categorias_alimentos WHERE nombre='Panadería'), 'unidad', 270, 9.0, 55.0, 1.0, 60),
  ('Lentejas', (SELECT id FROM categorias_alimentos WHERE nombre='Legumbres'), 'g', 340, 24.0, 60.0, 1.5, NULL),
  ('Garbanzos', (SELECT id FROM categorias_alimentos WHERE nombre='Legumbres'), 'g', 360, 20.0, 61.0, 6.0, NULL),
  ('Porotos', (SELECT id FROM categorias_alimentos WHERE nombre='Legumbres'), 'g', 330, 22.0, 60.0, 1.5, NULL),
  ('Tomate', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 20, 0.9, 3.9, 0.2, 120),
  ('Cebolla', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 40, 1.1, 9.0, 0.1, 110),
  ('Zanahoria', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 41, 0.9, 10.0, 0.2, 80),
  ('Zapallo italiano', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 17, 1.2, 3.1, 0.3, 200),
  ('Lechuga', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 15, 1.4, 2.9, 0.2, 300),
  ('Ajo', (SELECT id FROM categorias_alimentos WHERE nombre='Verduras'), 'unidad', 149, 6.4, 33.0, 0.5, 5),
  ('Palta', (SELECT id FROM categorias_alimentos WHERE nombre='Frutas'), 'unidad', 160, 2.0, 9.0, 15.0, 200),
  ('Plátano', (SELECT id FROM categorias_alimentos WHERE nombre='Frutas'), 'unidad', 89, 1.1, 23.0, 0.3, 120),
  ('Manzana', (SELECT id FROM categorias_alimentos WHERE nombre='Frutas'), 'unidad', 52, 0.3, 14.0, 0.2, 180),
  ('Limón', (SELECT id FROM categorias_alimentos WHERE nombre='Frutas'), 'unidad', 29, 1.1, 9.0, 0.3, 80),
  ('Pollo', (SELECT id FROM categorias_alimentos WHERE nombre='Aves'), 'g', 165, 31.0, 0.0, 3.6, NULL),
  ('Carne molida de vacuno', (SELECT id FROM categorias_alimentos WHERE nombre='Carnes'), 'g', 250, 17.0, 0.0, 20.0, NULL),
  ('Merluza', (SELECT id FROM categorias_alimentos WHERE nombre='Pescados y mariscos'), 'g', 90, 18.0, 0.0, 1.5, NULL),
  ('Huevo', (SELECT id FROM categorias_alimentos WHERE nombre='Huevos'), 'unidad', 143, 12.6, 0.7, 9.5, 55),
  ('Leche', (SELECT id FROM categorias_alimentos WHERE nombre='Lácteos'), 'ml', 60, 3.2, 4.8, 3.3, NULL),
  ('Queso', (SELECT id FROM categorias_alimentos WHERE nombre='Lácteos'), 'g', 356, 25.0, 2.0, 28.0, NULL),
  ('Yogur natural', (SELECT id FROM categorias_alimentos WHERE nombre='Lácteos'), 'g', 61, 3.5, 4.7, 3.3, NULL),
  ('Papa', (SELECT id FROM categorias_alimentos WHERE nombre='Tubérculos'), 'unidad', 77, 2.0, 17.0, 0.1, 150),
  ('Aceite de oliva', (SELECT id FROM categorias_alimentos WHERE nombre='Aceites y grasas'), 'ml', 884, 0.0, 0.0, 100.0, NULL),
  ('Nueces', (SELECT id FROM categorias_alimentos WHERE nombre='Frutos secos'), 'g', 654, 15.0, 14.0, 65.0, NULL),
  ('Salsa de tomate', (SELECT id FROM categorias_alimentos WHERE nombre='Condimentos y salsas'), 'g', 29, 1.4, 6.0, 0.2, NULL);

INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida) VALUES
  ('Arroz con pollo', 'Dorar el pollo en trozos con la cebolla, el ajo y la zanahoria picados. Agregar el arroz, cubrir con agua y cocinar tapado 20 minutos.', 40, 2, 'almuerzo,cena'),
  ('Lentejas con arroz', 'Sofreír la cebolla, el ajo y la zanahoria. Agregar las lentejas y el arroz con agua y cocinar a fuego bajo hasta que estén blandos.', 45, 2, 'almuerzo,cena'),
  ('Tortilla de verduras', 'Saltear la papa, la cebolla y el zapallo italiano en cubos. Mezclar con los huevos batidos y cocinar por ambos lados.', 25, 2, 'almuerzo,cena'),
  ('Fideos con salsa de tomate', 'Cocer los fideos. Sofreír la cebolla y el ajo, agregar la salsa de tomate y mezclar con los fideos. Servir con queso rallado.', 25, 2, 'almuerzo,cena'),
  ('Fideos con carne molida', 'Cocer los fideos. Sofreír la carne con cebolla, ajo y tomate picado hasta que esté cocida y mezclar con los fideos.', 35, 2, 'almuerzo,cena'),
  ('Merluza al horno con papas', 'Cocer las papas en rodajas en el horno. Agregar la merluza con limón, ajo y aceite y hornear 15 minutos.', 40, 2, 'almuerzo,cena'),
  ('Ensalada de lechuga, tomate y palta', 'Cortar la lechuga, el tomate y la palta. Aliñar con jugo de limón y aceite de oliva.', 10, 2, 'almuerzo,cena'),
  ('Avena con leche y plátano', 'Cocer la avena en la leche a fuego bajo durante 5 minutos. Servir con plátano en rodajas.', 10, 2, 'desayuno,merienda'),
  ('Huevos revueltos con pan', 'Batir los huevos y revolverlos en una sartén con aceite. Servir con pan marraqueta.', 10, 2, 'desayuno,merienda'),
  ('Pan con palta y huevo', 'Cocer los huevos, aplastar la palta sobre el pan y agregar el huevo en rodajas.', 10, 2, 'desayuno,merienda'),
  ('Yogur con manzana y nueces', 'Servir el yogur con la manzana picada y las nueces troceadas.', 5, 2, 'desayuno,merienda'),
  ('Porotos con arroz', 'Cocer los porotos con cebolla, zanahoria y zapallo italiano. Servir acompañado de arroz cocido.', 50, 2, 'almuerzo,cena'),
  ('Garbanzos con verduras', 'Sofreír cebolla, ajo, zanahoria y tomate. Agregar los garbanzos cocidos y cocinar 15 minutos.', 45, 2, 'almuerzo,cena'),
  ('Pollo al horno con papas', 'Marinar el pollo con limón, ajo y aceite. Hornear junto con las papas en trozos hasta que estén doradas.', 55, 2, 'almuerzo,cena'),
  ('Pastel de papas con carne', 'Cocer la carne con cebolla. Cubrir con puré de papas con leche, agregar huevo y gratinar al horno.', 60, 4, 'almuerzo,cena'),
  ('Sándwich de queso y tomate', 'Armar el sándwich con pan marraqueta, queso y rodajas de tomate.', 10, 2, 'merienda,cena'),
  ('Batido de plátano y leche', 'Licuar el plátano con la leche y la avena hasta obtener una mezcla homogénea.', 5, 2, 'desayuno,merienda');

INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Arroz';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Pollo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Zanahoria';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Arroz con pollo' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Lentejas';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 100 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Arroz';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Zanahoria';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con arroz' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 4 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de verduras' AND a.nombre='Huevo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de verduras' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de verduras' AND a.nombre='Zapallo italiano';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de verduras' AND a.nombre='Papa';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de verduras' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 250 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Fideos';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Salsa de tomate';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 40 FROM recetas r, alimentos a WHERE r.nombre='Fideos con salsa de tomate' AND a.nombre='Queso';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 250 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Fideos';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 250 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Carne molida de vacuno';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Tomate';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Fideos con carne molida' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con papas' AND a.nombre='Merluza';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con papas' AND a.nombre='Papa';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con papas' AND a.nombre='Limón';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con papas' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con papas' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de lechuga, tomate y palta' AND a.nombre='Lechuga';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de lechuga, tomate y palta' AND a.nombre='Tomate';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de lechuga, tomate y palta' AND a.nombre='Palta';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de lechuga, tomate y palta' AND a.nombre='Limón';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 10 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de lechuga, tomate y palta' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 80 FROM recetas r, alimentos a WHERE r.nombre='Avena con leche y plátano' AND a.nombre='Avena';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 400 FROM recetas r, alimentos a WHERE r.nombre='Avena con leche y plátano' AND a.nombre='Leche';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Avena con leche y plátano' AND a.nombre='Plátano';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 4 FROM recetas r, alimentos a WHERE r.nombre='Huevos revueltos con pan' AND a.nombre='Huevo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Huevos revueltos con pan' AND a.nombre='Pan marraqueta';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 5 FROM recetas r, alimentos a WHERE r.nombre='Huevos revueltos con pan' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Pan con palta y huevo' AND a.nombre='Pan marraqueta';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Pan con palta y huevo' AND a.nombre='Palta';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Pan con palta y huevo' AND a.nombre='Huevo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Yogur con manzana y nueces' AND a.nombre='Yogur natural';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Yogur con manzana y nueces' AND a.nombre='Manzana';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 30 FROM recetas r, alimentos a WHERE r.nombre='Yogur con manzana y nueces' AND a.nombre='Nueces';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Porotos';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 100 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Arroz';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Zanahoria';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Zapallo italiano';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Porotos con arroz' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Garbanzos';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Tomate';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Zanahoria';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Garbanzos con verduras' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 400 FROM recetas r, alimentos a WHERE r.nombre='Pollo al horno con papas' AND a.nombre='Pollo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Pollo al horno con papas' AND a.nombre='Papa';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Pollo al horno con papas' AND a.nombre='Limón';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Pollo al horno con papas' AND a.nombre='Ajo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Pollo al horno con papas' AND a.nombre='Aceite de oliva';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Pastel de papas con carne' AND a.nombre='Carne molida de vacuno';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 4 FROM recetas r, alimentos a WHERE r.nombre='Pastel de papas con carne' AND a.nombre='Papa';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Pastel de papas con carne' AND a.nombre='Cebolla';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Pastel de papas con carne' AND a.nombre='Huevo';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 100 FROM recetas r, alimentos a WHERE r.nombre='Pastel de papas con carne' AND a.nombre='Leche';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Sándwich de queso y tomate' AND a.nombre='Pan marraqueta';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 60 FROM recetas r, alimentos a WHERE r.nombre='Sándwich de queso y tomate' AND a.nombre='Queso';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Sándwich de queso y tomate' AND a.nombre='Tomate';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Batido de plátano y leche' AND a.nombre='Plátano';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 400 FROM recetas r, alimentos a WHERE r.nombre='Batido de plátano y leche' AND a.nombre='Leche';
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria) SELECT r.id, a.id, 30 FROM recetas r, alimentos a WHERE r.nombre='Batido de plátano y leche' AND a.nombre='Avena';

-- Verificación: debe dar 14, 28, 17 y 79
SELECT (SELECT COUNT(*) FROM categorias_alimentos) AS categorias, (SELECT COUNT(*) FROM alimentos) AS alimentos, (SELECT COUNT(*) FROM recetas) AS recetas, (SELECT COUNT(*) FROM receta_ingredientes) AS ingredientes;
