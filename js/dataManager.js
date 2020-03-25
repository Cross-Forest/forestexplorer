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

// EN ESTE FICHERO METO TODAS LAS FUNCIONES RELACIONADAS CON LA OBTENCIÓN DE DATOS DEL TRIPLE STORE

// DATOS DE ESPECIES

function getSpeciesInfo(callback) {
	// inicializo lista con las especies top
	var suristop = _.toArray(config.especiesTop);
	// obtengo subclases de suristop
	getSubclassesSpecies(suristop, function() { // aquí ya tengo la taxonomía de especies
		// obtengo el número de individuos directos de cada especie
		countTreesSpecies(function() {				
			// cojo nombres científicos, nombres vulgares, wikipedia page y sameAs de las especies
			var suris = _.keys(Datinv.especies);
			getPropsResources(DataProv, suris, [onturis.prScientificName, onturis.prVulgarName, 
					onturis.prWikipediaPage, onturis.prSameAs], 
					Datinv.especies, function() {
				// callback?
				if (callback != undefined)
					callback();
			});
			
			// guardo la lista expandida de especies para cada una (lo hace rápido y bien)
			var evsuris = _.keys(Datinv.especies);
			while(evsuris.length > 0) {
				var newevsuris = [];
				_.each(evsuris, function(suri) {
					// recupero especie
					var especie = Datinv.especies[suri];
					// ajusto nivel (para determinar si es especie/género/familia/clase)
					if (especie.nivel == undefined)
						especie.nivel = 0;
					else
						especie.nivel++;
					// obtengo la uri de cualquier subespecie sin expandir
					var algsubsuri = _.find(especie.subclasses, function(subsuri) {
						return Datinv.especies[subsuri].expuris == undefined;					
					});
					// si no está definida, puedo hacer la expansión de uris
					if (algsubsuri == undefined) {
						// inicializo con la uri de la propia especie
						especie.expuris = [suri];
						// y ahora incluimos las de la subclases
						_.each(especie.subclasses, function(subsuri) {
							especie.expuris = _.union(especie.expuris, Datinv.especies[subsuri].expuris);
						});					
					}
					else // hay que esperar a la siguiente iteración
						newevsuris.push(suri);
				});				
				// actualizo lista de tipos a evaluar
				evsuris = newevsuris;
			}
		});
	});
}
function getSubclassesSpecies(sturis, callback) {
	var nrequests = sturis.length;
	_.each(sturis, function(sturi) {
		// obtengo lista de pares de superclase-subclase a partir de la clase sturi
		DataProv.getData("subclasses", { 'uri' : sturi}, function(datos) {
			// fue todo bien, inicializo clase sturi			
			initClass(Datinv.especies, sturi);		
			// analizo cada fila
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var supuri = row.sup.value;
				var suburi = row.sub.value;
				// inicializo clases
				initClass(Datinv.especies, supuri);
				initClass(Datinv.especies, suburi);
				// guardo subclase
				Datinv.especies[supuri].subclasses.push(suburi);
			});						
			// decremento peticiones
			nrequests--;
			// callback?
			if (nrequests <= 0 && callback != undefined)
				callback();
		});	
	});
}

function initClass(objbase, cluri) {
	if (objbase[cluri] == undefined) {
		objbase[cluri] = {
			"uri" : cluri, 
			//"prefix": _.findKey(queryPrefixes, function(pu) { return cluri.startsWith(pu); }) 
		};
		objbase[cluri].subclasses = [];		
	}
}


// DATOS DE USOS PARA LAS TESELAS

function getUsesInfo(callback) {
	// obtengo lista de pares de superclase-subclase a partir de onturis.use
	DataProv.getData("subclasses", { 'uri' : onturis.use}, function(datos) {
		// fue todo bien, inicializo clase onturis.use			
		initClass(Datinv.usos, onturis.use);		
		// analizo cada fila de los resultados
		_.each(datos.results.bindings, function(row) {
			// obtengo datos
			var supuri = row.sup.value;
			var suburi = row.sub.value;
			// inicializo clases
			initClass(Datinv.usos, supuri);
			initClass(Datinv.usos, suburi);
			// guardo subclase
			Datinv.usos[supuri].subclasses.push(suburi);
		});
		// pido etiquetas
		var uuris = _.keys(Datinv.usos);
		getLabels(uuris, Datinv.usos, function() {
			// callback?
			if (callback != undefined)
				callback();
		});
		// obtengo usos expandidos (de manera parecida a las especies)
		var evuuris = _.keys(Datinv.usos);
		while(evuuris.length > 0) {
			var newevuuris = [];
			_.each(evuuris, function(uuri) {
				// recupero uso
				var uso = Datinv.usos[uuri];
				// obtengo la uri de cualquier subuso sin expandir
				var algsubuuri = _.find(uso.subclasses, function(subuuri) {
					return Datinv.usos[subuuri].expuris == undefined;					
				});
				// si no está definida, puedo hacer la expansión de uris
				if (algsubuuri == undefined) {
					// inicializo con la uri del propio uso
					uso.expuris = [uuri];
					// y ahora incluimos las de la subclases
					_.each(uso.subclasses, function(subuuri) {
						uso.expuris = _.union(uso.expuris, Datinv.usos[subuuri].expuris);
					});					
				}
				else // hay que esperar a la siguiente iteración
					newevuuris.push(uuri);
			});				
			// actualizo lista de tipos a evaluar
			evuuris = newevuuris;
		}
	});
}


// DATOS DE PROVINCIAS
function processCountAllSpeciesPlotsProv() {
	// sólo se llama una vez para procesar la consulta cacheada "countallspeciesplotsprov" 
	// si no estuviera, habrá que obtener las parcelas con cada especie seleccionada 
	// utilizando la consulta "countspeciesplotsprov" que es lenta...
	if (cachedQueries != undefined && cachedQueries.countallspeciesplotsprov != undefined) {
		console.log('Consulta "countallspeciesplotsprov" cacheada');
		// obtengo todas las uris de las especies
		var spuris = _.keys(Datinv.especies);		
		// inicializo nparcs de todas las especies para todas las provincias
		_.each(provs.features, function(prov) {
			if (prov.properties.nparcs == undefined)
				prov.properties.nparcs = {};
			_.each(spuris, function(spuri) {
				prov.properties.nparcs[spuri] = 0;
			});				
		});
		// guardo el número de parcelas por provincia y especie
		_.each(cachedQueries.countallspeciesplotsprov.results.bindings, function(row) {
			// obtengo datos
			var provuri = row.provuri.value;
			var spuri = row.spuri.value;
			var nplots = Number(row.nplots.value);
			// y guardo número de parcelas en la provincia por especie
			var codprov = uriToLiteral(provuri);
			// obtengo la provincia
			var prov = _.find(provs.features, function(ft) {
				return ft.properties.codigo === codprov;
			});
			if (prov != undefined) 
				prov.properties.nparcs[spuri] = nplots;
		});
		// borro los datos cacheados
		delete cachedQueries.countallspeciesplotsprov;
	}
}

function countPlotsProvs(callback) {
	// compruebo si tengo los datos mirando la primera provincia
	var pr0 = provs.features[0];
	if (pr0.properties.nallparcs == undefined) {
		// pido datos al endpoint
		DataProv.getData("countspeciesplotsprov", {}, function(datos) {
			// éxito: inicializo nallparcs para todas las provincias
			_.each(provs.features, function(prov) {
				prov.properties.nallparcs = 0;
			});
			// guardo el número de parcelas por provincia
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var provuri = row.provuri.value;
				var nplots = Number(row.nplots.value);
				// y guardo número de parcelas en la provincia por especie
				var codprov = uriToLiteral(provuri);
				// obtengo la provincia
				var prov = _.find(provs.features, function(ft) {
					return ft.properties.codigo === codprov;
				});
				if (prov != undefined) 
					prov.properties.nallparcs = nplots;
			});
			// callback?
			if (callback != undefined)
				callback();
		});
		// sumo una consulta al evento del mapa
		addMapEvent('queries', 1);
	}
	else if (callback != undefined) // no requests, callback
		callback();
}

function countSpeciesPlotsProvs(suris, callback) {
	// num de consultas
	var nrequests = 0;
	// para cada especie...
	_.each(suris, function(suri) {
		// compruebo si tengo los datos mirando la primera provincia
		var pr0 = provs.features[0];
		if (pr0.properties.nparcs == undefined || pr0.properties.nparcs[suri] == undefined) {
			// incremento peticiones
			nrequests ++;
			// hace falta recuperar los datos...
			var qobjt = suri === onturis.tree? {} : {'suri' : suri};
			DataProv.getData("countspeciesplotsprov", qobjt, function(datos) {
				// éxito: inicializo nparcs para todas las provincias
				_.each(provs.features, function(prov) {
					if (prov.properties.nparcs == undefined)
						prov.properties.nparcs = {};
					prov.properties.nparcs[suri] = 0;
				});
				// guardo el número de parcelas por provincia y especie
				_.each(datos.results.bindings, function(row) {
					// obtengo datos
					var provuri = row.provuri.value;
					var nplots = Number(row.nplots.value);
					// y guardo número de parcelas en la provincia por especie
					var codprov = uriToLiteral(provuri);
					// obtengo la provincia
					var prov = _.find(provs.features, function(ft) {
						return ft.properties.codigo === codprov;
					});
					if (prov != undefined) 
						prov.properties.nparcs[suri] = nplots;
				});
				// decremento peticiones
				nrequests--;
				// callback?
				if (nrequests <= 0 && callback != undefined)
					callback();			
			});
			// sumo una consulta al evento del mapa
			addMapEvent('queries', 1);
		}
	});
	// no requests, callback
	if (nrequests == 0 && callback != undefined)
		callback();		
}

function countAllSpeciesTreesProvs(callback) {
	// obtengo bounding box para el evento
	var bounds = Map.getBounds();
	var bbox = {};
	bbox.north = Math.ceil(100 * bounds._northEast.lat) / 100;
	bbox.south = Math.floor(100 * bounds._southWest.lat) / 100;
	bbox.west = Math.floor(100 * bounds._southWest.lng) / 100;
	bbox.east = Math.ceil(100 * bounds._northEast.lng) / 100;	
	// logging info
	addBoxMapEvent(etiquetaBox(bbox)); // incluyo etiqueta del box para el evento del mapa

	// compruebo si tengo los datos mirando la primera provincia
	var pr0 = provs.features[0];
	if (pr0.properties.narbs == undefined) {
		// defino el procesamiento a hacer
		var procesamiento = function(datos) {
			// éxito: inicializo narbs para todas las provincias
			_.each(provs.features, function(prov) {
				prov.properties.narbs = {};
			});
			// guardo el número de árboles de cada especie por provincia
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var provuri = row.provuri.value;
				var spuri = row.spuri.value;
				var ntrees = Number(row.ntrees.value);
				// y guardo número de árboles por especie en la provincia
				var codprov = uriToLiteral(provuri);
				// obtengo la provincia
				var prov = _.find(provs.features, function(ft) {
					return ft.properties.codigo === codprov;
				});
				// guardo número de árboles de cada especie en la provincia
				if (prov != undefined)
					prov.properties.narbs[spuri] = ntrees;				
			});
			// borro los datos cacheados si los hubiera
			delete cachedQueries.countallspeciestreesprov;
			// callback?
			if (callback != undefined)
				callback();
		};
		// si tengo los datos cacheados...
		if (cachedQueries != undefined && cachedQueries.countallspeciestreesprov != undefined) {
			console.log('Consulta "countallspeciestreesprov" cacheada');
			procesamiento(cachedQueries.countallspeciestreesprov);
		}
		else {// no está cacheada, pedimos datos al endpoint
			DataProv.getData('countallspeciestreesprov', {}, procesamiento);
			// sumo una consulta al evento del mapa
			addMapEvent('queries', 1);
		}
	}
	else if (callback != undefined) // no requests, callback
		callback();
}

// obtengo información de especies (existencias) de las provincias
function getInfoSpeciesProvs(callback) {
	// defino primero el procesamiento de los infoEspecies de las provincias
	// (a completar una vez que tenga las uris de los infoEspecies en cuestión)
	var procesamiento = function() {
		// primero obtengo las uris de los objetos en cuestión
		var ieuris = [];		
		for (var ind=0; ind < provs.features.length; ind++) {
			var prov = provs.features[ind];
			ieuris = ieuris.concat(prov.properties.infoEspecies);
		}
		/* costoso computacionalmente
		_.each(provs.features, function(prov) {
			ieuris = _.union(ieuris, prov.properties.infoEspecies);
		});*/		
		// 3-dic-2019 rehecho por el cambio en la anotación de los datos
		// pido siguientes propiedades
		var propuris = [ onturis.prBasalArea, onturis.prNumberTrees, onturis.prVolumeWithBark, onturis.prHasSpeciesIFN ];
		var npconsultas = getPropsResources(DataProv, ieuris, propuris, Datinv.infoEspecies, function() {
			// y el callback final si lo hay
			if (callback != undefined) // no requests, callback
				callback();
		});
		// sumo consultas al evento del mapa
		addMapEvent('queries', npconsultas);		
		/* previo
		// ahora obtengo los tipos para la especie
		var ntconsultas = getTypes(ieuris, Datinv.infoEspecies, function() {
			// continuamos con las siguientes propiedades
			var propuris = [ onturis.prBasalArea, onturis.prNumberTrees, onturis.prVolumeWithBark ];
			var npconsultas = getPropsResources(DataProv, ieuris, propuris, Datinv.infoEspecies, function() {
				// y el callback final si lo hay
				if (callback != undefined) // no requests, callback
					callback();
			});
			// sumo consultas al evento del mapa
			addMapEvent('queries', npconsultas);
		});	
		// sumo consultas al evento del mapa
		addMapEvent('queries', ntconsultas);*/
	};
	// compruebo si tengo los datos de infoEspecies mirando la primera provincia
	var pr0 = provs.features[0];
	if (pr0.properties.infoEspecies == undefined) {
		// obtengo las infoEspecies de las provincias
		DataProv.getData('infospeciesprov', {}, function(datos) {
			// éxito: inicializo infoEspecies para todas las provincias
			_.each(provs.features, function(prov) {
				prov.properties.infoEspecies = [];
			});
			// guardo la información de especies por provincia
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var provuri = row.provuri.value;
				var ispuri = row.ispuri.value;
				// guardo ispuri en la provincia
				var codprov = uriToLiteral(provuri);
				// obtengo la provincia
				var prov = _.find(provs.features, function(ft) {
					return ft.properties.codigo === codprov;
				});
				// guardo ispuri en la provincia e inicializo objeto en infoEspecies
				if (prov != undefined) {
					prov.properties.infoEspecies.push(ispuri);
					Datinv.infoEspecies[ispuri] = {};
				}
			});
			// vamos al procesamiento
			procesamiento();
		});
		// sumo una consulta al evento del mapa
		addMapEvent('queries', 1);
	}
	else	// vamos al procesamiento
		procesamiento();
}


// DATOS DE TESELAS

function getPatchesInBox(objt) {
	// obtengo bounding box
	var bounds = Map.getBounds();
	
	// obtengo areamin a partir del zoom (areamin no cambiará por nivel de zoom)
	var zoom = Map.getZoom();
	if (Sesion.tessAreaminZoom[zoom] == undefined) { // a calcular areamin		
		// calculo el área en m2 del bounding box
		var ancho = Math.round(bounds.getNorthWest().distanceTo(bounds.getNorthEast()));
		var alto = Math.round(bounds.getNorthWest().distanceTo(bounds.getSouthWest())); 
		var area = ancho * alto;
		var size = Map.getSize(); // pixeles en "x" y en "y"
		var areapixel = Math.round( area / (size.x*size.y) );
	
		// sólo pinto las teselas con al menos cierta área en píxeles
		var amin = config.minpixelspatch * areapixel;
		if (amin > config.maxareamin)
			amin = config.maxareamin; // saturo área	
		
		// guardo areamin
		Sesion.tessAreaminZoom[zoom] = amin;
	}
	var areamin = Sesion.tessAreaminZoom[zoom]; // aquí ya lo tengo
	
	// preparo factor para el redondeo de las coordenadas
	var factor = "1";
	for (var i=0; i<objt.nd; i++)
		factor += "0";
	factor = Number(factor);
	
	// guardo la info en el objeto de teselas
	objt.north = Math.ceil(factor * bounds._northEast.lat) / factor;
	objt.south = Math.floor(factor * bounds._southWest.lat) / factor;
	objt.west = Math.floor(factor * bounds._southWest.lng) / factor;
	objt.east = Math.ceil(factor * bounds._northEast.lng) / factor;
	objt.areamin = areamin;
	
	// defino la capa en la que busco
	objt.layer = zoom < config.zLugar? onturis.mergedLayer : onturis.originalLayer;
	// indico si hay que repintar
	if (Sesion.tlayer == undefined || Sesion.tlayer !== objt.layer)
		objt.repintar = true;
	Sesion.tlayer = objt.layer; // guardo la capa de teselas en la sesión
	
	if (Datinv.boxesTeselas[objt.areamin] != undefined)
		console.log("#boxes de teselas cacheadas (área min " + objt.areamin + "): " + Datinv.boxesTeselas[objt.areamin].length);
	console.time("Descomposición de boxes de teselas I" + objt.idtimeout);
	
	// obtengo los boxes en los que descomponer el lienzo
	var blienzo = interseccion(objt, objt); // hago una copia del box
	objt.boxes = descomponerBoxes(blienzo, Datinv.boxesTeselas[objt.areamin], "turis", clipTeselasBox);

	console.timeEnd("Descomposición de boxes de teselas I" + objt.idtimeout);
		
	// inicializo boxes cargados y pintados
	objt.boxescargados = 0;
	objt.boxespintados = 0;
	
	// logging info
	addBoxMapEvent(etiquetaBox(objt)); // incluyo etiqueta del box para el evento del mapa
	console.log("Box de teselas del lienzo I" + objt.idtimeout + ": "+ etiquetaBox(objt));
	_.each(objt.boxes, function(box, ind) {
		console.log("Box de teselas I" + objt.idtimeout + "#" + ind + ": " + etiquetaBox(box));
	});
		
	// ahora solicito cada box
	_.each(objt.boxes, function(box, indbox) {
		// inicializo pags, npags cargadas, npags pintadas y nconsultas
		box.pags = [];
		box.npagscargadas = 0;
		box.npagspintadas = 0;
		box.nconsultas = [];
		// ¿tengo ya los datos?
		if (box.turis != undefined) {
			box.cacheada = true;
			// incluyo la lista de turis a la página, incluyo número de páginas y borro turis (redundante)
			box.pags[0] = box.turis;
			box.npagsfin = 1;
			delete box.turis;
			// callback?
			if (objt.cargaDatos != undefined) 
				objt.cargaDatos(objt, indbox, 0);
		}
		else { // toca pedir los datos al endpoint...
			box.cacheada = false;
			box.qobj = {
				"latsouth" : box.south,
				"latnorth" : box.north,
				"lngwest" : box.west,
				"lngeast" : box.east,
				"areamin" : objt.areamin,
				"layer" : objt.layer,
				"limit" : 500, // pruebo con páginas de 500
			};
			// obtengo las teselas en la bounding box para cada página
			paginaPatchesInBox(objt, indbox, 0);
		}	
	});	
}
function paginaPatchesInBox(objt, indbox, indpag) {
	// recupero el box, la página del box y el qobjt
	var mibox = objt.boxes[indbox];
	var qobj = mibox.qobj;
	qobj.offset = indpag * qobj.limit;
	// obtengo las teselas de mi página index del box indbox
	DataProv.getData("patchesinbox", qobj, function(datos) {
		// detecto si hay más páginas
		if (datos.results.bindings.length < qobj.limit) // no hay más, guardo el número de páginas
			mibox.npagsfin = indpag + 1;
		else // voy pidiendo la siguiente página
			paginaPatchesInBox(objt, indbox, indpag + 1);
				
		// proceso los resultados (válido incluso con 0 resultados)
		// inicializo turis
		var turis = [];
		// process results
		_.each(datos.results.bindings, function(row) {
			// continue only if not blank nodes
			if (row.patch.type === "uri" && row.poly.type === "uri") {
				// obtengo datos de la tesela
				var patch = {};
				patch.uri = row.patch.value;
				patch.poly = row.poly.value;
				// obtengo datos del polígono
				var poly = {};
				poly.uri = row.poly.value;
				poly.west = Number(row.west.value);
				poly.east = Number(row.east.value);
				poly.north = Number(row.north.value);
				poly.south = Number(row.south.value);
				poly.area = Number(row.area.value);
				// guardo la tesela si no estaba antes
				if (Datinv.teselas[patch.uri] == undefined)
					Datinv.teselas[patch.uri] = patch;
				// guardo el polígono si no estaba antes
				if (Datinv.poligonos[poly.uri] == undefined)
					Datinv.poligonos[poly.uri] = poly;
				// guardo la uri de la tesela en la página
				turis.push(patch.uri);					
			}
		});
		// guardo página
		mibox.pags[indpag] = turis;
		// siguiente paso en el procesamiento
		if (objt.cargaDatos != undefined) 
			objt.cargaDatos(objt, indbox, indpag);
	});
	// actualizo número de consultas
	mibox.nconsultas.push(1);
}


function cargarDatosTeselasBox(objt, indbox, indpag) {
	// obtengo mi box y la página que me toca
	var mibox = objt.boxes[indbox];
	var mipag = mibox.pags[indpag];
	// obtengo los datos necesarios para pintar (si es que faltan)
	// para las teselas pido los tipos para el uso y la provincia (faltarían las especies)
	mibox.nconsultas.push(getTypes(mipag, Datinv.teselas, function() {
		// ya tengo los tipos (uso), voy con la provincia
		mibox.nconsultas.push(getPropsResources(DataProv, mipag, [onturis.prProv], Datinv.teselas, function() {	
			// ajusto las provincias de las teselas
			_.each(mipag, function(turi) {
				// si la tesela no tiene campo "prov" y hay datos de la propiedad prprov
				if (Datinv.teselas[turi].prov == undefined && Datinv.teselas[turi][onturis.prProv] != undefined) {
					// inicializo a null
					Datinv.teselas[turi].prov = null;
					// si hay algún valor válido
					if (Datinv.teselas[turi][onturis.prProv].ovals != undefined 
							&& Datinv.teselas[turi][onturis.prProv].ovals.length > 0) {
						// obtengo etiqueta provincia
						var codprov = uriToLiteral(Datinv.teselas[turi][onturis.prProv].ovals[0]);
						// obtengo la provincia
						var prov = _.find(provs.features, function(ft) {
							return ft.properties.codigo === codprov;
						});
						// guardo campo prov
						Datinv.teselas[turi].prov = prov.properties.provincia;
					}				
				}			
			}); // ajuste provincias
			
			// cojo los polígonos sin geometría
			var polis = []; // lista de polígonos
			_.each(mipag, function(turi) {
				var puri = Datinv.teselas[turi].poly;
				if (Datinv.poligonos[puri].geometry == undefined)
					polis.push(puri);
			});
			var prwkt = onturis.prWKT;
			mibox.nconsultas.push(getPropsResources(DataProv, polis, [ prwkt ], Datinv.poligonos, function() {
				// ajusto los datos de los polígonos
				_.each(polis, function(puri) {		
					// si el polígono no tiene campo "geometria" y hay datos de la propiedad prwkt
					if (Datinv.poligonos[puri].geometry == undefined && Datinv.poligonos[puri][prwkt] != undefined) {				
						// inicializo a null
						Datinv.poligonos[puri].geometry = null;
						// convierto geometría de WKT a GeoJSON y guardo
						var wkt = getLiteral(Datinv.poligonos[puri][prwkt].lits);
						if (wkt != undefined) {// si hay algo que convertir...
							var gjson = parse(wkt);
							Datinv.poligonos[puri].geometry = gjson;
						}
						else {
							// caso raro, no había nada en Datinv.poligonos[puri][prwkt]
							console.warn("PROBLEMA con la geometría del polígono "+puri);
							delete Datinv.poligonos[puri].geometry;
							// (a ver si en la siguiente pasada obtiene el valor)
						}
						// borro datos de la propiedad prwkt (para que no ocupe tanto)
						delete Datinv.poligonos[puri][prwkt];
					}
				});
				
				// pido la cobertura arbórea de las teselas de monte
				var tmcuris = _.filter(mipag, function(turi) {
					// compruebo si la tesela tiene uso de monte con el tipo
					var tesela = Datinv.teselas[turi];
					return _.intersection(Datinv.usos[onturis.forestuse].expuris, tesela.types).length > 0;
				});
				mibox.nconsultas.push(getPropsResources(DataProv, tmcuris, [onturis.prCanopyCoverTrees], 
						Datinv.teselas, function() {
					// queda obtener la información de especies de las teselas de monte si no la tengo
					var tmuris = _.filter(mipag, function(turi) {
						// compruebo si la tesela tiene uso de monte con el tipo y descarto la que tiene info de especies
						var tesela = Datinv.teselas[turi];
						return _.intersection(Datinv.usos[onturis.forestuse].expuris, tesela.types).length > 0
							&& tesela.especies == undefined;
					});
					// preparo lotes de 100 uris
					var lote = 100;
					var urisets = [];
					for (var ind=0; tmuris.length > ind*lote; ind++) {
						var begin = ind*lote;
						var end = (ind + 1)*lote;
						if (end > tmuris.length)
							end = tmuris.length;		
						urisets.push( tmuris.slice( begin, end ) );		
					}	
					// número de peticiones
					var nrequests = urisets.length;	
					mibox.nconsultas.push(nrequests);
					// no requests, callback
					if (nrequests == 0 && objt.render != undefined) {
						objt.render(objt, indbox, indpag);
						return;
					}	
					// solicito cada lote
					_.each(urisets, function(uriset) {
						// preparo subconjunto de uris
						var aux = {};
						aux.uris = [];
						aux.fpuris = []; 
						_.each(uriset, function(uri) {
							aux.uris.push(uri);
							aux.fpuris.push("<"+uri+">");
						});
						DataProv.getData('speciespatches', aux, function(datos) {
							// creo objeto especies aquí (ya que ha habido respuesta buena)
							_.each(aux.uris, function(evuri) {
								if (Datinv.teselas[evuri].especies == undefined)
									Datinv.teselas[evuri].especies = {};
							});						
							// ahora proceso los resultados
							_.each(datos.results.bindings, function(row) {
								// obtengo datos
								var turi = row.patch.value;
								var spuri = row.species.value;
								var porc = Number(row.spperc.value);
								// guardo
								Datinv.teselas[turi].especies[spuri] = porc;
							});	
							// decremento peticiones
							nrequests--;
							// callback?
							if (nrequests <= 0 && objt.render != undefined)
								objt.render(objt, indbox, indpag);
						});	
					});			
				})); // consulta cobertura arbórea
			})); // consulta prwkt			
		})); // consulta provincia
	})); // consulta tipos
}


function combinarBoxesTeselas(box0, box1, nbox) {
	// obtengo todas las uris de las teselas
	var allturis = _.union(box0.turis, box1.turis);
	// y ahora obtengo las que que corresponden a nbox
	nbox.turis = _.filter(allturis, function(turi) {
		// recupero polígono de la tesela
		var poly = Datinv.poligonos[Datinv.teselas[turi].poly];
		// si la tesela tiene contacto con nbox, adentro
		return poly.south < nbox.north &&
				poly.north > nbox.south &&
				poly.west < nbox.east &&
				poly.east > nbox.west;
	});
}
function clipTeselasBox(box) {
	// obtengo las teselas que pertenecen al clip
	box.turis = _.filter(box.turis, function(turi) {
		// recupero polígono de la tesela
		var poly = Datinv.poligonos[Datinv.teselas[turi].poly];
		// si la tesela tiene contacto con nbox, adentro
		return poly.south < box.north &&
				poly.north > box.south &&
				poly.west < box.east &&
				poly.east > box.west;
	});
}



// DATOS DE PARCELAS Y ÁRBOLES

function getPlotsInBox(objp) {
	// obtengo bounding box
	var bounds = Map.getBounds();
	
	// preparo factor para el redondeo
	var factor = "1";
	for (var i=0; i<objp.nd; i++)
		factor += "0";
	factor = Number(factor);	
	
	// guardo la info en el objeto de parcelas
	objp.north = Math.ceil(factor * bounds._northEast.lat) / factor;
	objp.south = Math.floor(factor * bounds._southWest.lat) / factor;
	objp.west = Math.floor(factor * bounds._southWest.lng) / factor;
	objp.east = Math.ceil(factor * bounds._northEast.lng) / factor;
	
	console.log("#boxes de parcelas cacheadas: " + Datinv.boxesParcelas.length);
	console.time("Descomposición de boxes de parcelas I" + objp.idtimeout);
	
	
	// obtengo los boxes en los que descomponer el lienzo
	var blienzo = interseccion(objp, objp); // hago una copia del box
	objp.boxes = descomponerBoxes(blienzo, Datinv.boxesParcelas, "puris", clipParcelasBox);
	
	console.timeEnd("Descomposición de boxes de parcelas I" + objp.idtimeout);
	
	// inicializo boxes cargados y pintados
	objp.boxescargados = 0;
	objp.boxespintados = 0;
	
	// TODO quitar
	console.log("Box de parcelas del lienzo I" + objp.idtimeout + ": "+ etiquetaBox(objp));
	_.each(objp.boxes, function(box, ind) {
		console.log("Box de parcelas I" + objp.idtimeout + "#" + ind + ": " + etiquetaBox(box));
	});
		
	// ahora solicito cada box
	_.each(objp.boxes, function(box, indbox) {
		// inicializo pags, npags cargadas, npags pintadas y nconsultas
		box.pags = [];
		box.npagscargadas = 0;
		box.npagspintadas = 0;
		box.nconsultas = [];
		// ¿tengo ya los datos?
		if (box.puris != undefined) {
			box.cacheada = true;
			// incluyo la lista de puris a la página, incluyo número de páginas y borro puris (redundante)
			box.pags[0] = box.puris;
			box.npagsfin = 1;
			delete box.puris;
			// callback?
			if (objp.cargaDatos != undefined) 
				objp.cargaDatos[0](objp, indbox, 0, 0);
		}
		else { // toca pedir los datos al endpoint...
			box.cacheada = false;
			box.qobj = {
				"latsouth" : box.south,
				"latnorth" : box.north,
				"lngwest" : box.west,
				"lngeast" : box.east,
				"cluri" : onturis.plot,
				"limit" : 500, // pruebo con páginas de 500
			};
			// obtengo las parcelas en la bounding box para cada página
			paginaPlotsInBox(objp, indbox, 0);
		}	
	});
}
function paginaPlotsInBox(objp, indbox, indpag) {
	// recupero el box, la página del box y el qobjt
	var mibox = objp.boxes[indbox];
	var qobj = mibox.qobj;
	qobj.offset = indpag * qobj.limit;
	// obtengo las parcelas del box indbox en la página ind
	DataProv.getData("plotsinbox", qobj, function(datos) {
		// detecto si hay más páginas
		if (datos.results.bindings.length < qobj.limit) // no hay más, guardo el número de páginas
			mibox.npagsfin = indpag + 1;
		else // voy pidiendo la siguiente página
			paginaPlotsInBox(objp, indbox, indpag + 1);
				
		// proceso los resultados (válido incluso con 0 resultados)
		// inicializo puris
		var puris = [];
		// process results
		_.each(datos.results.bindings, function(row) {
			// continue only if it is not a blank node
			if (row.plot.type === "uri") {
				// obtengo datos de la parcela
				var plot = {};
				plot.uri = row.plot.value;
				plot.lat = Number(row.lat.value);
				plot.lng = Number(row.lng.value);
				//plot.narbs = {}; // inicializo el objeto con el número de árboles por especie
				// guardo la parcela si no estaba antes
				if (Datinv.parcelas[plot.uri] == undefined)
					Datinv.parcelas[plot.uri] = plot;
				// guardo la uri de la parcela en la página
				puris.push(plot.uri);
			}
		});
		// guardo página
		mibox.pags[indpag] = puris;
		// siguiente paso en el procesamiento
		if (objp.cargaDatos != undefined) 
			objp.cargaDatos[0](objp, indbox, indpag, 0);
	});
	// actualizo número de consultas
	mibox.nconsultas.push(1);
}

function cargarDatosParcelasBox(objp, indbox, indpag, indcd) {
	// obtengo mi box y la página que me toca
	var mibox = objp.boxes[indbox];
	var mipag = mibox.pags[indpag];
	// obtengo datos de la provincia y de la información de especies de las parcelas
	var props = [onturis.prContainsSpecies2, onturis.prProv];
	mibox.nconsultas.push(getPropsResources(DataProv, mipag, props, Datinv.parcelas, function() {
		// actualizo info de provincias
		_.each(mipag, function(puri) {
			// si la parcela no tiene campo "prov" y hay datos de la propiedad prprov
			if (Datinv.parcelas[puri].prov == undefined && Datinv.parcelas[puri][onturis.prProv] != undefined) {
				// inicializo a null
				Datinv.parcelas[puri].prov = null;
				// si hay algún valor válido
				if (Datinv.parcelas[puri][onturis.prProv].ovals != undefined && Datinv.parcelas[puri][onturis.prProv].ovals.length > 0) {
					// obtengo etiqueta provincia
					var codprov = uriToLiteral(Datinv.parcelas[puri][onturis.prProv].ovals[0]);
					// obtengo la provincia
					var prov = _.find(provs.features, function(pr) {
						return pr.properties.codigo === codprov;
					});
					// guardo campo prov
					Datinv.parcelas[puri].prov = prov.properties.provincia;
				}				
			}
		});
		// completo datos de la información de especies (existencias) de las parcelas
		var ieuris = [];
		for (var ind=0; ind < mipag.length; ind++) {
			var puri = mipag[ind];
			ieuris = ieuris.concat(Datinv.parcelas[puri][onturis.prContainsSpecies2].ovals);
		}
		/* costoso computacionalmente
		_.each(mipag, function(puri) {
			ieuris = _.union(ieuris, Datinv.parcelas[puri][onturis.prContainsSpecies2].ovals);
		});*/
		// inicializo infoespecies
		_.each(ieuris, function(ieuri) {
			if (Datinv.infoEspecies[ieuri] == undefined)
				Datinv.infoEspecies[ieuri] = {};
		});		
		// 3-dic-2019 rehecho por el cambio en la anotación de los datos
		// pido siguientes propiedades
		var isprops = [onturis.prBasalAreaPlot, onturis.prNumberTreesPlot, onturis.prVolumeWithBarkPlot, onturis.prHasSpeciesIFN];
		mibox.nconsultas.push(getPropsResources(DataProv, ieuris, isprops, Datinv.infoEspecies, function() {
			// y obtengo número de árboles por especie en cada parcela del inventario
			mibox.nconsultas.push(countTreesPlot(mipag, Datinv.parcelas, function() {
				// si hay callback...
				if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
					objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
				else if (objp.render != undefined) // vamos al render
					objp.render(objp, indbox, indpag);
			}));		
		}));		
		/* previo
		// tipos de especies...
		mibox.nconsultas.push(getTypes(ieuris, Datinv.infoEspecies, function() {
			// continuamos con las siguientes propiedades
			var isprops = [onturis.prBasalAreaPlot, onturis.prNumberTreesPlot, onturis.prVolumeWithBarkPlot];
			mibox.nconsultas.push(getPropsResources(DataProv, ieuris, isprops, Datinv.infoEspecies, function() {
				// y obtengo número de árboles por especie en cada parcela del inventario
				mibox.nconsultas.push(countTreesPlot(mipag, Datinv.parcelas, function() {
					// si hay callback...
					if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
						objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
					else if (objp.render != undefined) // vamos al render
						objp.render(objp, indbox, indpag);
				}));		
			}));
		})); // tipos especies
		*/
	})); // provincia e infoEspecies
}

function combinarBoxesParcelas(box0, box1, nbox) {
	// obtengo todas las uris de las parecelas
	var allpuris = _.union(box0.puris, box1.puris);
	// y ahora obtengo las que que corresponden a nbox
	nbox.puris = _.filter(allpuris, function(puri) {
		// recupero parcela
		var parc = Datinv.parcelas[puri];
		// si la parcela está dentro del box, adentro
		return parc.lat > nbox.south &&
				parc.lat < nbox.north &&
				parc.lng > nbox.west &&
				parc.lng < nbox.east;
	});
}
function clipParcelasBox(box) {
	// obtengo las parcelas que pertenecen al clip
	box.puris = _.filter(box.puris, function(puri) {
		// recupero parcela
		var parc = Datinv.parcelas[puri];
		// si la parcela está dentro del box, adentro
		return parc.lat > box.south &&
				parc.lat < box.north &&
				parc.lng > box.west &&
				parc.lng < box.east;
	});
}


function getTreesInBox(objp, indbox, indpag, indcd) {
	// obtengo mi box y la página que me toca
	var mibox = objp.boxes[indbox];
	var mipag = mibox.pags[indpag];
	// obtengo lista de parcelas del box que no tienen árboles
	var puris = [];
	_.each(mipag, function(puri) {		
		if (Datinv.parcelas[puri].arbs == undefined)
			puris.push(puri);
	});
	// preparo lotes de 100 uris
	var lote = 100;
	var urisets = [];
	for (var ind=0; puris.length > ind*lote; ind++) {
		var begin = ind*lote;
		var end = (ind + 1)*lote;
		if (end > puris.length)
			end = puris.length;		
		urisets.push( puris.slice( begin, end ) );		
	}
	// num de consultas
	var nrequests = urisets.length;
	mibox.nconsultas.push(urisets.length);
	
	// si no hay consultas que hacer, ejecuto el callback si lo hay
	if (nrequests == 0) {
		if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
			objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
		else if (objp.render != undefined) // vamos al render
			objp.render(objp, indbox, indpag);
		return 0;
	}
	
	// solicito cada lote
	_.each(urisets, function(uriset) {
		// preparo subconjunto de uris de parcelas
		var aux = {};
		aux.puris = [];
		aux.fpuris = []; 
		_.each(uriset, function(uri) {
			aux.puris.push(uri);
			aux.fpuris.push("<"+uri+">");
		});
		// a por los datos
		DataProv.getData('treesinplots', aux, function(datos) {
			// inicializo el array de árboles por parcela (ya que ha habido respuesta buena)
			_.each(aux.puris, function(puri) {
				Datinv.parcelas[puri].arbs = [];
			});			
			// ahora proceso los resultados
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var tree = {};
				tree.uri = row.tree.value;
				tree.plot = row.plot.value;
				tree.lat = Number(row.lat.value);
				tree.lng = Number(row.lng.value);
				// guardo
				Datinv.arboles[tree.uri] = tree;
				Datinv.parcelas[tree.plot].arbs.push(tree.uri);
			});				
			// decremento peticiones
			nrequests--;
			// callback?
			if (nrequests <= 0) {
				if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
					objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
				else if (objp.render != undefined) // vamos al render
					objp.render(objp, indbox, indpag);
			}
		});			
	});	
}

function getTreeTypesInBox(objp, indbox, indpag, indcd) {
	// obtengo mi box y la página que me toca
	var mibox = objp.boxes[indbox];
	var mipag = mibox.pags[indpag];
	// obtengo lista de árboles del box que no tienen tipo
	var turis = [];
	_.each(mipag, function(puri) {
		if (Datinv.parcelas[puri].arbs != undefined) {
			_.each(Datinv.parcelas[puri].arbs, function(turi) {
				if (Datinv.arboles[turi].types == undefined)
					turis.push(turi);
			});		
		}
	});
	// pido tipos
	mibox.nconsultas.push(getTypes(turis, Datinv.arboles, function() {
		if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
			objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
		else if (objp.render != undefined) // vamos al render
			objp.render(objp, indbox, indpag);
	}));
}

function getTreeMeasuresInBox(objp, indbox, indpag, indcd) {
	// obtengo mi box y la página que me toca
	var mibox = objp.boxes[indbox];
	var mipag = mibox.pags[indpag];
	// obtengo lista de árboles del box
	var turis = [];
	_.each(mipag, function(puri) {
		if (Datinv.parcelas[puri].arbs != undefined) {
			turis = turis.concat(Datinv.parcelas[puri].arbs);
			/* costoso computacionalmente
			turis = _.union(turis, Datinv.parcelas[puri].arbs);*/
		}
	});
	// propiedades a extraer
	var props = [onturis.prHasHeightInMeters,
		onturis.prHasDBH1InMillimeters,
		onturis.prHasDBH2InMillimeters
		];
	// llamo a la función para extraer propiedades de manera genérica
	mibox.nconsultas.push(getPropsResources(DataProv, turis, props, Datinv.arboles, function() {
		// callback?
		if (indcd + 1 < objp.cargaDatos.length) // siguiente paso de carga de datos
			objp.cargaDatos[indcd + 1](objp, indbox, indpag, indcd + 1);
		else if (objp.render != undefined) // vamos al render
			objp.render(objp, indbox, indpag);
	}));
}


function countTreesPlot(box, target, callback) {
	// num de consultas
	var nrequests = 0;
	var totalrequests = 0;
	// lista de uris a obtener
	var uris = [];
	// obtengo qué parcelas no tienen algo en "narbs"
	_.each(box, function(puri) {		
		if (target[puri].narbs == undefined)
			uris.push(puri);	
	});
	// preparo lotes de 100 uris
	var lote = 100;
	var urisets = [];
	for (var ind=0; uris.length > ind*lote; ind++) {
		var begin = ind*lote;
		var end = (ind + 1)*lote;
		if (end > uris.length)
			end = uris.length;		
		urisets.push( uris.slice( begin, end ) );		
	}
	// incremento peticiones
	nrequests += urisets.length;
	totalrequests += urisets.length;

	// solicito cada lote
	_.each(urisets, function(uriset) {
		// preparo subconjunto de uris de parcelas
		var aux = {};
		aux.puris = [];
		aux.fpuris = []; 
		_.each(uriset, function(uri) {
			aux.puris.push(uri);
			aux.fpuris.push("<"+uri+">");
		});
		// a por los datos
		DataProv.getData('counttreesplot', aux, function(datos) {
			// inicializo objeto "narbs" (ya que ha habido respuesta buena)
			_.each(aux.puris, function(puri) {
				target[puri].narbs = {};
			});			
			// ahora proceso los resultados
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var plot = row.plot.value;
				var species = row.species.value
				var ntrees = Number(row.ntrees.value);
				// guardo
				target[plot].narbs[species] = ntrees;
			});				
			// decremento peticiones
			nrequests--;
			// callback?
			if (nrequests <= 0 && callback != undefined)
				callback();
		});			
	});

	// no requests, callback
	if (nrequests == 0 && callback != undefined)
		callback();
		
	// devuelvo número de consultas hechas
	return totalrequests;
}

function countTreesSpecies(callback) {
	// obtengo lista de todas las especies
	var suris = _.keys(Datinv.especies);
	// defino procesamiento
	var procesamiento = function(datos) {
		// inicializo a 0 el número de individuos (ya que ha habido respuesta buena)
		_.each(suris, function(evuri) {
			if (Datinv.especies[evuri].indivs == undefined)
				Datinv.especies[evuri].indivs = {};
			Datinv.especies[evuri].indivs.count = 0;
		});						
		// ahora guardo los resultados
		_.each(datos.results.bindings, function(row) {
			// obtengo datos
			var cluri = row.species.value;
			var count = Number(row.count.value);
			// guardo sólo si existe
			if (Datinv.especies[cluri] != undefined && Datinv.especies[cluri].indivs != undefined)
				Datinv.especies[cluri].indivs.count = count;
		});	
		// calculo suma de todos los individuos (incluyo los de las subclases)
		_.each(suris, function(suri) {
			var nindivs = Datinv.especies[suri].indivs.count; // los directos
			// sumos los individuos de las subclases
			var suburis = getAllSubclasses(suri, Datinv.especies);
			_.each(suburis, function(suburi) {
				nindivs += Datinv.especies[suburi].indivs.count;		
			});
			// guardo la suma de todos
			Datinv.especies[suri].indivs.countALL = nindivs;		
		});
		// borro los datos cacheados si los hubiera
		delete cachedQueries.counttreesspecies;
		// callback?
		if (callback != undefined)
			callback();
	};
	// si tengo los datos cacheados...
	if (cachedQueries != undefined && cachedQueries.counttreesspecies != undefined) {
		console.log('Consulta "counttreesspecies" cacheada');
		procesamiento(cachedQueries.counttreesspecies);
	}
	else // no está cacheada, pedimos datos al endpoint
		DataProv.getData('counttreesspecies', {}, procesamiento);
}




// TIPOS, PROPIEDADES Y LABELS (COMÚN)
function getTypes(ruris, target, callback) {	
	// obtengo lista de recursos sin tipo
	var uris = [];
	_.each(ruris, function(ruri) {
		if (target[ruri].types == undefined) 
			uris.push(ruri);
	});
	// preparo lotes de 100 uris
	var lote = 100;
	var urisets = [];
	for (var ind=0; uris.length > ind*lote; ind++) {
		var begin = ind*lote;
		var end = (ind + 1)*lote;
		if (end > uris.length)
			end = uris.length;		
		urisets.push( uris.slice( begin, end ) );		
	}
	// num de consultas
	var nrequests = urisets.length;
	var totalrequests = urisets.length;	
	// solicito cada lote
	_.each(urisets, function(uriset) {
		// preparo subconjunto de uris a pedir el tipo
		var aux = {};
		aux.uris = [];
		aux.furis = []; 
		_.each(uriset, function(uri) {
			aux.uris.push(uri);
			aux.furis.push("<"+uri+">");
		});
		// a por los datos
		DataProv.getData('types', aux, function(datos) {
			// inicializo el array de tipos (ya que ha habido respuesta buena)
			_.each(aux.uris, function(uri) {
				target[uri].types = [];
			});			
			// ahora proceso los resultados
			_.each(datos.results.bindings, function(row) {
				// guardo datos
				var uri = row.uri.value;
				var type = row.type.value;
				target[uri].types.push(type);
			});				
			// decremento peticiones
			nrequests--;
			// callback?
			if (nrequests <= 0 && callback != undefined)
				callback();
		});			
	});	
	// no requests, callback
	if (nrequests == 0 && callback != undefined)
		callback();	
	// devuelvo número de consultas hechas
	return totalrequests;
}

function getPropsResources(provdatos, ruris, props, target, callback) {
	// num de consultas
	var nrequests = 0;
	var totalrequests = 0;
	// chequeo los recursos implicados en cada propiedad
	_.each(props, function(prop) {
		// lista de uris a obtener
		var uris = [];
		// analizo si existen los recursos y las propiedades
		_.each(ruris, function(ruri) {
			// creo el recurso si hace falta
			if (target[ruri] == undefined)
				target[ruri] = { "uri" : ruri };
			if (target[ruri][prop] == undefined) 
				uris.push(ruri);
		});

		// preparo lotes de 100 uris
		var lote = 100;
		var urisets = [];
		for (var ind=0; uris.length > ind*lote; ind++) {
			var begin = ind*lote;
			var end = (ind + 1)*lote;
			if (end > uris.length)
				end = uris.length;		
			urisets.push( uris.slice( begin, end ) );		
		}
		
		// incremento peticiones
		nrequests += urisets.length;
		totalrequests += urisets.length;
				
		// solicito cada lote
		_.each(urisets, function(uriset) {
			// preparo subconjunto de uris
			var aux = {};
			aux.propuri = prop;
			aux.uris = [];
			aux.furis = []; 
			_.each(uriset, function(uri) {
				aux.uris.push(uri);
				aux.furis.push("<"+uri+">");
			});
			provdatos.getData('propvalues', aux, function(datos) {
				// creo los arrays de las propiedades aquí (ya que ha habido respuesta buena)
				_.each(aux.uris, function(evuri) {
					if (target[evuri][prop] == undefined)
						target[evuri][prop] = {};
				});						
				// ahora proceso los resultados
				_.each(datos.results.bindings, function(row) {
					// obtengo datos
					var evuri = row.uri.value;
					var value = row.value;
					// object property?
					if (value.type === "uri") {
						// inicializo array de object values si hace falta
						if (target[evuri][prop].ovals == undefined)
							target[evuri][prop].ovals = [];
						// guardo valor
						target[evuri][prop].ovals.push(value.value);
					}					
					// datatype property?
					else if (value.type === "literal" || value.type === "typed-literal") {	
						// inicializo objeto de literales si hace falta
						if (target[evuri][prop].lits == undefined)
							target[evuri][prop].lits = {};
						// guardo valor
						var lang = value["xml:lang"] == undefined? config.nolang : value["xml:lang"];
						var val = value.value;
						target[evuri][prop].lits[lang] = val;
					}
					// no incluyo blank nodes
				});				
				// decremento peticiones
				nrequests--;
				// callback?
				if (nrequests <= 0 && callback != undefined)
					callback();
			});			
		});
	});	
	// no requests, callback
	if (nrequests == 0 && callback != undefined)
		callback();
	
	// devuelvo número de consultas hechas
	return totalrequests;
}

function getLabels(evuris, target, callback) {
	// lista de uris a obtener
	var uris = [];
	// analizo si existen etiquetas de cada objeto implicado
	_.each(evuris, function(evuri) {
		if (target[evuri].label == undefined) 
			uris.push(evuri);
	});
	
	// preparo lotes de 100 uris
	var lote = 100;
	var urisets = [];
	for (var ind=0; uris.length > ind*lote; ind++) {
		var begin = ind*lote;
		var end = (ind + 1)*lote;
		if (end > uris.length)
			end = uris.length;		
		urisets.push( uris.slice( begin, end ) );		
	}
	
	// número de peticiones
	var nrequests = urisets.length;	
	
	// no requests, callback
	if (nrequests == 0 && callback != undefined) {
		callback();
		return 0;
	}
	
	// solicito cada lote
	_.each(urisets, function(uriset) {
		// preparo subconjunto de uris
		var aux = {};
		aux.uris = [];
		aux.furis = []; 
		_.each(uriset, function(uri) {
			aux.uris.push(uri);
			aux.furis.push("<"+uri+">");
		});
		DataProv.getData('labels', aux, function(datos) {
			// creo los arrays de las propiedades aquí (ya que ha habido respuesta buena)
			_.each(aux.uris, function(evuri) {
				if (target[evuri].label == undefined)
					target[evuri].label = {};
			});						
			// ahora proceso los resultados
			_.each(datos.results.bindings, function(row) {
				// obtengo datos
				var evuri = row.uri.value;
				var lang = row.label["xml:lang"] == undefined? config.nolang : row.label["xml:lang"];
				var val = row.label.value;
				// guardo
				if (target[evuri].label != undefined) 
					target[evuri].label[lang] = val;
			});	
			// decremento peticiones
			nrequests--;
			// callback?
			if (nrequests <= 0 && callback != undefined)
				callback();
		});			
	});
	
	// devuelvo número de consultas hechas
	return urisets.length;
}