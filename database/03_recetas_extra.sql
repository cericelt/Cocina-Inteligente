-- Recetas adicionales (usan solo los alimentos del catálogo base).
-- Se puede ejecutar más de una vez: no duplica recetas que ya existan.
-- Ejecutar en MySQL Workbench con la base cocina_inteligente seleccionada (USE cocina_inteligente;).

INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Tostadas con queso y tomate', 'Tostar el pan, agregar el queso en láminas y el tomate en rodajas.', 10, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Tostadas con queso y tomate');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Avena con manzana y nueces', 'Cocer la avena en la leche 5 minutos. Servir con manzana picada y nueces.', 10, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Avena con manzana y nueces');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Yogur con plátano y avena', 'Mezclar el yogur con el plátano en rodajas y la avena.', 5, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Yogur con plátano y avena');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Huevos duros con palta', 'Cocer los huevos 10 minutos, pelar y servir con palta y limón.', 15, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Huevos duros con palta');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Pan con queso y palta', 'Tostar el pan, untar la palta y agregar el queso.', 5, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Pan con queso y palta');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Tortilla de queso', 'Batir los huevos con el queso rallado y cocinar en sartén con aceite.', 10, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Tortilla de queso');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Batido de yogur y plátano', 'Licuar el yogur, la leche y el plátano.', 5, 2, 'desayuno,merienda'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Batido de yogur y plátano');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Merluza al horno con limón', 'Hornear la merluza con limón y aceite 15 minutos. Acompañar con ensalada de lechuga.', 25, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Merluza al horno con limón');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Ensalada de pollo con palta', 'Cocer el pollo, desmenuzar y mezclar con lechuga, tomate y palta. Aliñar con limón y aceite.', 25, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Ensalada de pollo con palta');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Carne molida con papas', 'Sofreír la carne con cebolla y ajo. Cocer las papas y servir juntas.', 35, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Carne molida con papas');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Tortilla de papas', 'Freír las papas y la cebolla en rodajas, mezclar con huevos batidos y cocinar por ambos lados.', 30, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Tortilla de papas');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Crema de zapallo italiano', 'Hervir el zapallo con papa y cebolla, moler con la leche y sazonar.', 30, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Crema de zapallo italiano');
INSERT INTO recetas (nombre, instrucciones, tiempo_preparacion, porciones, tipo_comida)
SELECT 'Lentejas con verduras', 'Sofreír cebolla, ajo y zanahoria. Agregar lentejas y zapallo italiano con agua y cocinar 30 minutos.', 40, 2, 'almuerzo,cena'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM recetas WHERE nombre='Lentejas con verduras');

INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Tostadas con queso y tomate' AND a.nombre='Pan marraqueta'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 60 FROM recetas r, alimentos a WHERE r.nombre='Tostadas con queso y tomate' AND a.nombre='Queso'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Tostadas con queso y tomate' AND a.nombre='Tomate'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 80 FROM recetas r, alimentos a WHERE r.nombre='Avena con manzana y nueces' AND a.nombre='Avena'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 400 FROM recetas r, alimentos a WHERE r.nombre='Avena con manzana y nueces' AND a.nombre='Leche'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Avena con manzana y nueces' AND a.nombre='Manzana'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 30 FROM recetas r, alimentos a WHERE r.nombre='Avena con manzana y nueces' AND a.nombre='Nueces'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 250 FROM recetas r, alimentos a WHERE r.nombre='Yogur con plátano y avena' AND a.nombre='Yogur natural'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Yogur con plátano y avena' AND a.nombre='Plátano'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 40 FROM recetas r, alimentos a WHERE r.nombre='Yogur con plátano y avena' AND a.nombre='Avena'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Huevos duros con palta' AND a.nombre='Huevo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Huevos duros con palta' AND a.nombre='Palta'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Huevos duros con palta' AND a.nombre='Limón'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Pan con queso y palta' AND a.nombre='Pan marraqueta'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Pan con queso y palta' AND a.nombre='Palta'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 60 FROM recetas r, alimentos a WHERE r.nombre='Pan con queso y palta' AND a.nombre='Queso'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 4 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de queso' AND a.nombre='Huevo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 80 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de queso' AND a.nombre='Queso'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 10 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de queso' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Batido de yogur y plátano' AND a.nombre='Yogur natural'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Batido de yogur y plátano' AND a.nombre='Leche'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Batido de yogur y plátano' AND a.nombre='Plátano'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con limón' AND a.nombre='Merluza'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con limón' AND a.nombre='Limón'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con limón' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Merluza al horno con limón' AND a.nombre='Lechuga'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 250 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Pollo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Lechuga'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Tomate'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Palta'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Limón'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Ensalada de pollo con palta' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 300 FROM recetas r, alimentos a WHERE r.nombre='Carne molida con papas' AND a.nombre='Carne molida de vacuno'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Carne molida con papas' AND a.nombre='Papa'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Carne molida con papas' AND a.nombre='Cebolla'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Carne molida con papas' AND a.nombre='Ajo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 10 FROM recetas r, alimentos a WHERE r.nombre='Carne molida con papas' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de papas' AND a.nombre='Papa'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 4 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de papas' AND a.nombre='Huevo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de papas' AND a.nombre='Cebolla'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 30 FROM recetas r, alimentos a WHERE r.nombre='Tortilla de papas' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 3 FROM recetas r, alimentos a WHERE r.nombre='Crema de zapallo italiano' AND a.nombre='Zapallo italiano'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Crema de zapallo italiano' AND a.nombre='Papa'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Crema de zapallo italiano' AND a.nombre='Cebolla'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Crema de zapallo italiano' AND a.nombre='Leche'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 10 FROM recetas r, alimentos a WHERE r.nombre='Crema de zapallo italiano' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 200 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Lentejas'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Cebolla'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 2 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Ajo'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Zanahoria'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 1 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Zapallo italiano'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
INSERT INTO receta_ingredientes (receta_id, alimento_id, cantidad_necesaria)
SELECT r.id, a.id, 15 FROM recetas r, alimentos a WHERE r.nombre='Lentejas con verduras' AND a.nombre='Aceite de oliva'
AND NOT EXISTS (SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id AND ri.alimento_id=a.id);
