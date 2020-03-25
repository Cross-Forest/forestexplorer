/*
   Copyright 2019, Guillermo Vega-Gorgojo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// GEOMETRÍAS RECTÁNGULOS

// box es cualquier objeto con las siguientes claves:
// - west
// - south
// - east
// - north

function esBoxValido(box) {
	return box.north >= box.south && box.west <= box.east;
}

function etiquetaBox(box) {
	return "N:" + box.north +"|S:" + box.south + "|W:" + box.west + "|E:" + box.east;
}

function areaBox(box) {
	if (esBoxValido(box)) {
		var ancho = box.east - box.west;
		var alto = box.north - box.south;
		return ancho*alto;
	}
	else
		return 0;
}

function esLinea(box) {
	if ( (box.north == box.south && box.east > box.west) || (box.north > box.south && box.east == box.west) ) 
		return true;
	else
		return false;
}

function esPunto(box) {
	return box.north == box.south && box.east == box.west;
}

function interseccion(box0, box1) { // cualquier box válido que no sea un punto (puede ser una línea)
	var box = {
		north: Math.min(box0.north, box1.north),
		south: Math.max(box0.south, box1.south),
		west: Math.max(box0.west, box1.west),
		east: Math.min(box0.east, box1.east),
	};
	if (esBoxValido(box) && !esPunto(box))
		return box;
	else
		return null;
}

function ordenarBoxes(boxes) {
	// ordeno por boxes más al norte y en segundo lugar más al oeste
	return _.sortBy(boxes, function(box) { return 100000*box.north + box.west; }).reverse();
}


// permito intersecciones al guardar en esta versión
function incluirBox(boxes, boxcand, fcombinar) {
	// si boxcand tiene área 0, ya hemos acabado
	if (areaBox(boxcand) == 0)
		return boxes;
	// obtengo la lista de boxes sin ninguna intersección con boxcand
	var boxesdevolver = boxes0SinInterseccion(boxes, [ boxcand ]); // éstos ya son seguros de devolver
	// obtengo lista de boxes con intersección con el candidato
	var boxesconinter = _.difference(boxes, boxesdevolver);
	// si no hay ninguna intersección, incluyo al candidato en los boxes a devolver
	if (boxesconinter.length == 0)
		boxesdevolver.push(boxcand);
	else {
		// hay intersecciones, analizamos si es posible una unión de un único box (ya sea porque uno está incluido o porque se extienda) 
		var bnew = boxcand; // inicializo con el candidato
		// recorro todos los boxes con intersección y analizo el resultado de combinar
		_.each(boxesconinter, function(bold) {
			// analizo la combinación
			var comboxes = combinarBoxes(bold, bnew); // la función fcombinar es costosa, sólo la aplico si procede...
			if (comboxes.length == 1) // la combinación es efectiva, actualizo bnew			
				bnew = combinarBoxes(bold, bnew, fcombinar)[0];
			else // no gano nada al combinar, meto el box que tenía
				boxesdevolver.push(bold);	
		});
		// por último, incluyo a bnew
		boxesdevolver.push(bnew);
	}	
	// termino devolviendo la lista de boxesdevolver
	return boxesdevolver;
}


function boxes0SinInterseccion(lb0, lb1) {
	var lb0dev = []; // devuelvo los boxes de lb0 sin intersección con lb1
	_.each(lb0, function(b0cand) {
		var boxlb1 = _.find(lb1, function(mib1) {
			return interseccion(mib1, b0cand) != null;
		});
		if (boxlb1 == null) // si no hay ninguna coincidencia a la lista
			lb0dev.push(b0cand);
	});
	return lb0dev;
}


function combinarBoxes(box0, box1, fcombinar) {	
	var comboxes = [];
	var bint = interseccion(box0, box1);
	if (bint == null) {
		// no hay intersección, devuelvo los boxes originales
		comboxes.push(box0);
		comboxes.push(box1);
	}
	else {
		// obtengo el área de la intersección y actúo
		var areaint = areaBox(bint);
		if (areaint > 0) { // hay intersección
			var areabox0 = areaBox(box0);
			var areabox1 = areaBox(box1);
			if (areaint == areabox0) // box0 incluido en box1
				comboxes.push(box1);
			else if (areaint == areabox1) // box1 incluido en box0
				comboxes.push(box0);
			else  // saldrán 1, 2 o 3 boxes (uno menos por cada dimensión vertical que compartan)
				comboxes = combinarBoxesConInterseccion(box0, box1, fcombinar);
		}
		else // se tocan...
			comboxes = combinarBoxesConInterseccion(box0, box1, fcombinar);
	}
	return comboxes;
}
function combinarBoxesConInterseccion(box0, box1, fcombinar) {
	var comboxes = [];
	var nbox0 = {
		north: Math.max(box0.north, box1.north),
		south: Math.min(box0.north, box1.north)			
	};
	var nbox1 = {
		north: Math.min(box0.north, box1.north),
		south: Math.max(box0.south, box1.south)			
	};
	var nbox2 = {
		north: Math.max(box0.south, box1.south),
		south: Math.min(box0.south, box1.south)			
	};
	// completo nbox0
	if (nbox0.north == box0.north) {
		nbox0.west = box0.west;
		nbox0.east = box0.east;			
	}
	else {
		nbox0.west = box1.west;
		nbox0.east = box1.east;			
	}
	// completo nbox1
	nbox1.west = Math.min(box0.west, box1.west);
	nbox1.east = Math.max(box0.east, box1.east);
	// completo nbox2
	if (nbox2.south == box0.south) {
		nbox2.west = box0.west;
		nbox2.east = box0.east;			
	}
	else {
		nbox2.west = box1.west;
		nbox2.east = box1.east;			
	}
	// postprocesamiento final:
	// 1) compruebo que el área de cada nuevo box sea mayor que 0 
	// 2) aplico función de combinación
	// 3) guardo resultado
	if (areaBox(nbox0) > 0) {
		if (fcombinar != undefined)
			fcombinar(box0, box1, nbox0);	
		comboxes.push(nbox0);
	}
	if (areaBox(nbox1) > 0) {
		if (fcombinar != undefined)
			fcombinar(box0, box1, nbox1);	
		comboxes.push(nbox1);
	}
	if (areaBox(nbox2) > 0) {
		if (fcombinar != undefined)
			fcombinar(box0, box1, nbox2);	
		comboxes.push(nbox2);
	}
	// devuelvo
	return comboxes;
}


function descomponerBoxes(blienzo, bclips, nprop, fclip) {
	// boxes a devolver
	var boxes = [];
	var seguir = true;
	while(seguir) {
		// obtengo los bclips válidos para la iteración
		var bclipsaux = [];
		_.each(bclips, function(boxev) {
			var bcl = interseccion(blienzo, boxev);
			if (bcl != null && areaBox(bcl) > 0) {
				// este clip me vale, añado un clon de las [nprop] originales
				bcl[nprop] = _.clone(boxev[nprop]);
				// incluyo área
				bcl.area = areaBox(bcl);
				// incluyo #dims en común con el bounding box del lienzo
				bcl.dims = 0;
				if (bcl.north == blienzo.north)
					bcl.dims++;
				if (bcl.south == blienzo.south)
					bcl.dims++;
				if (bcl.west == blienzo.west)
					bcl.dims++;
				if (bcl.east == blienzo.east)
					bcl.dims++;	
				// y lo incluyo en la lista
				bclipsaux.push(bcl);
			}	
		});
		// ordeno bclips por (1) dims y luego por (2) área
		bclips = _.sortBy(bclipsaux, function(bclip) {
			if (bclip.dims == 3 || bclip.dims == 4)
				return 10000000 + bclip.area;
			else
				return bclip.area;
		}).reverse();
	
		// si hay uno y tiene área mayor que 0...
		if (bclips.length > 0 && bclips[0].area != null && bclips[0].area > 0) {
			// obtengo el bclip, aplico la función de clip y lo meto en la lista a devolver
			var bcl = bclips[0];
			if (fclip != undefined)
				fclip(bcl);
			boxes.push(bcl);
			// actualizo bclips
			bclips = _.rest(bclips);
			// trabajamos con el bclip...
			if (bcl.dims == 4) // coincidencia perfecta
				seguir = false;
			else if (bcl.dims == 3) {			
				// recalculo el blienzo
				if (blienzo.north != bcl.north)
					blienzo.south = bcl.north;
				else if (blienzo.south != bcl.south)
					blienzo.north = bcl.south;
				else if (blienzo.west != bcl.west)
					blienzo.east = bcl.west;
				else if (blienzo.east != bcl.east)
					blienzo.west = bcl.east;
				if (areaBox(blienzo) == null || areaBox(blienzo) == 0)
					seguir = false; // no hay más espacio para llenar		
			} 
			else { // en otro caso
				seguir = false; // ésta será la última iteración				
				// meto los boxes restantes hasta llenar el lienzo
				// el superior
				var boxsup = {
					north: blienzo.north,
					south: bcl.north,
					west: blienzo.west,
					east: blienzo.east,
				};
				if (areaBox(boxsup) > 0)
					boxes.push(boxsup);
				// el de la izquierda
				var boxizq = {
					north: bcl.north,
					south: bcl.south,
					west: blienzo.west,
					east: bcl.west,
				};
				if (areaBox(boxizq) > 0)
					boxes.push(boxizq);
				// el de la derecha
				var boxder = {
					north: bcl.north,
					south: bcl.south,
					west: bcl.east,
					east: blienzo.east,
				};
				if (areaBox(boxder) > 0)
					boxes.push(boxder);
				// el inferior
				var boxinf = {
					north: bcl.south,
					south: blienzo.south,
					west: blienzo.west,
					east: blienzo.east,
				};
				if (areaBox(boxinf) > 0)
					boxes.push(boxinf);
			}
		}
		else { // no hay más bclips donde rascar...
			// incluyo el lienzo y no seguimos
			boxes.push(blienzo);
			seguir = false;
		}	
	}
	return boxes.reverse(); // los devuelvo en orden inverso para que empiece con los boxes sin datos
}
