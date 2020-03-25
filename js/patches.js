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

// TESELAS
function inicializarTeselas() {
	// devuelvo la capa GEOJSON para las teselas
	return 	L.geoJson(null, {
		style: function(feature) {
			// recupero objeto tesela
			var otes = Datinv.teselas[feature.properties.uri];		
			return {
				fillColor: colorTesela(otes, false), // color de relleno  
		        weight: 1,
        		opacity: 1,
		        color: colorTesela(otes, true), // color de borde
        		dashArray: '1',
		        fillOpacity: 0.3
			};
		},
		onEachFeature: function(feature, layer) {
			// recupero objeto tesela
			var otes = Datinv.teselas[feature.properties.uri];
			// cojo texto del popup
			var texto = popupTesela(otes);
			// pongo popup y hago realce
			layer.bindPopup(texto)
				.on({
					popupopen: function(e) { // realce
						var layer = e.target;
						layer.setStyle({
							fillOpacity: 0.4,
							weight: 2,
						});
					},
					popupclose: function(e) { // quitar realce
						var layer = e.target;
						layer.setStyle({
							fillOpacity: 0.3,
							weight: 1,
						});
					}
				});
		} // onEachFeature
	}).addTo(Map);
}
function colorTesela(tesela, esBorde) {
	// ¿hay uso?
	if (tesela.types == undefined) {
		console.warn("PROBLEMA CON USO DE TESELA "+tesela.uri);
		// devuelvo un color, en cualquier caso
		if (esBorde)
			return config.colplots[config.colindefind][4];
		else
			return config.colplots[config.colindefind][3];
	}
	// obtengo uri del uso para definir el color
	//var uuri = tesela[onturis.prHasUsage].ovals[0];
	
	//var nivel1 = Number(claseIFN.toString()[0]);
	//var nivel2 = Number(claseIFN.toString()[1]);
	
	// niveles por defecto
	var nivBorde = 3;
	var nivNormal = 2;
	var nivFiltrado = 7;
	var nivNoFiltrado = 1;
	var nivBordeNoFiltrado = 2;
	
	// valores por defecto
	var ind0 = config.colindefind; // valor por defecto (color gris)
	var ind1 = esBorde? nivBorde : nivNormal; // valor por defecto (intensidad)
	
	// detecto filtro de uso
	var hayfiltrouso = Sesion.usofilturis.length > 0;
	
	// reajusto ind1 si hay filtro de uso
	if (hayfiltrouso)
		ind1 = 	esBorde? nivBordeNoFiltrado : nivNoFiltrado;
	
	// compruebo tipo de uso
	if ( _.intersection(Datinv.usos[onturis.forestuse].expuris, tesela.types).length > 0 ) { // uso forestal
		// DETECCIÓN FILTRO DE USO
		var filtrandousotesela = false; // sólo si filtramos algo
		_.each(Sesion.usofilturis, function(fuuri) {
			if (  _.intersection(Datinv.usos[fuuri].expuris, tesela.types).length > 0 )
				filtrandousotesela = true;
		});
		// SELECCIÓN DE COLORES SI HAY FILTROS DE ESPECIES
		if (Sesion.espfilturis.length > 0 && tesela.especies != undefined) {
			// preparo colores a mezclar
			var cols = [];
			_.each(Sesion.espfilturis, function(spuri, ind) {
				// calculo porcentaje de cada especie filtrada para la tesela
				var porc = 0;
				// analizo especies de la tesela
				var esptesuris = _.keys(tesela.especies);
				_.each(esptesuris, function(esptesuri) {
					// si hay coincidencia con la especie filtrada, adentro
					if (_.contains(Datinv.especies[spuri].expuris, esptesuri))
						porc += tesela.especies[esptesuri];
				});		
				// si es mayor que 0 obtengo color y guardo
				if (porc > 0) {
					// caso sin filtros y no borde: asigno un 10% de bonus y saturo al 100%
					var caux = getColor(porc + 10, 100, config.colplots[Sesion.espfiltcolinds[ind]]);
					// ¿es borde?					
					if (esBorde) { // (caso normal 3)
						caux = config.colplots[Sesion.espfiltcolinds[ind]][nivBorde];
						// si estoy filtrando y no está incluido...
						if (hayfiltrouso && !filtrandousotesela)
							caux = config.colplots[Sesion.espfiltcolinds[ind]][nivBordeNoFiltrado];
					}
					else if (hayfiltrouso) {
						if (filtrandousotesela)	// intensidad 7
							caux = config.colplots[Sesion.espfiltcolinds[ind]][nivFiltrado];
						else	// intensidad 1
							caux = config.colplots[Sesion.espfiltcolinds[ind]][nivNoFiltrado];
					}
					// meto color a la saca
					cols.push(caux);			
				}
			});
			// si hay algún color...
			if (cols.length > 0) {
				if (cols.length == 1) // sólo uno
					return cols[0];
				else if (cols.length > 1) { // toca mezclar
					var cms = [];
					_.each(cols, function(micol) {
						cms.push($.Color(micol));
					});
					return Color_mixer.mix(cms);
				}			
			}
		}
		// SELECCIÓN DE COLOR SIN FILTRO DE ESPECIES
		ind0 = config.coltesforind; // verde claro (color de teselas de monte)
		// ajuste segundo índice		
		if (hayfiltrouso) { // si hay filtro de uso...
			if (filtrandousotesela)	
				ind1 = esBorde? nivBorde : nivFiltrado;
			else
				ind1 = esBorde? nivBordeNoFiltrado : nivNoFiltrado;
		}
		else { // analizo uso
			if ( _.intersection(Datinv.usos[onturis.usoarb].expuris, tesela.types).length > 0 ) // 110
				ind1 = 5;
			else if ( _.intersection(Datinv.usos[onturis.usoarbralo].expuris, tesela.types).length > 0 ) // 120
				ind1 = 3;
			else if ( _.intersection(Datinv.usos[onturis.usotempdes].expuris, tesela.types).length > 0 ) // 130
				ind1 = 1;
			else if ( _.intersection(Datinv.usos[onturis.usodes].expuris, tesela.types).length > 0 ) // 140
				ind1 = 1;
			else if ( _.intersection(Datinv.usos[onturis.usonoveg].expuris, tesela.types).length > 0 ) // 150
				ind1 = 1;
			else if ( _.intersection(Datinv.usos[onturis.usofuemonte].expuris, tesela.types).length > 0 ) // 160
				ind1 = 3;
			else if ( _.intersection(Datinv.usos[onturis.usoarbdisp].expuris, tesela.types).length > 0 ) // 170
				ind1 = 3;
			
			// si es borde
			if (esBorde)
				ind1 = nivBorde;
		}
	}
	else if ( _.intersection(Datinv.usos[onturis.agricuse].expuris, tesela.types).length > 0 ) // uso agrícola
		ind0 = config.coltesagrind; // naranja
	else if ( _.intersection(Datinv.usos[onturis.impruse].expuris, tesela.types).length > 0 ) // improductivo
		ind0 = config.coltesimpind; // gris
	else if ( _.intersection(Datinv.usos[onturis.wetlanduse].expuris, tesela.types).length > 0 ) // humedal
		ind0 = config.colteshumind; // celeste
	else if ( _.intersection(Datinv.usos[onturis.wateruse].expuris, tesela.types).length > 0 )  // agua	
		ind0 = config.coltesaguind; // azul
		
	// devuelvo color
	return config.colplots[ind0][ind1];
}
function popupTesela(tesela) {
	// preparo texto del popup para todas las teselas
	var texto = "<strong>"+getLiteral(dict.patch)+' '+uriToLiteral(tesela.uri)+"</strong>";
	// obtengo etiqueta provincia
	if (tesela.prov != undefined)
		texto += "<br>"+getLiteral(dict.provinceof)+' '+tesela.prov;
	// área
	var area = Datinv.poligonos[tesela.poly].area;	
	texto += "<br>"+getLiteral(dict.area)+": "+Number((area/10000).toFixed(2)).toLocaleString()+"ha";
	// uso del suelo	
	if (tesela.types != undefined) {	
		// obtengo la uri del primer uso válido
		var uuri = _.find(tesela.types, function(utype) {
			return Datinv.usos[utype] != undefined;
		});		
		if (uuri != null) {// si hay uri, muestro
			// muestro en negrita el uso si lo estoy filtrando
			var filtrandousotesela = false;
			_.each(Sesion.usofilturis, function(fuuri) {
			if (  _.intersection(Datinv.usos[fuuri].expuris, tesela.types).length > 0 )
				filtrandousotesela = true;
			});
			if (filtrandousotesela)
				texto += "<br>"+getLiteral(dict.soiluse)+': <strong>'+getLiteral(Datinv.usos[uuri].label)+"</strong>";
			else
				texto += "<br>"+getLiteral(dict.soiluse)+': '+getLiteral(Datinv.usos[uuri].label);
		}
	}
	// cobertura arbórea (teselas de monte)
	if (tesela[onturis.prCanopyCoverTrees] != undefined && tesela[onturis.prCanopyCoverTrees].lits != undefined) {
		texto += "<br>"+getLiteral(dict.canopycovertrees)+": "+getLiteral(tesela[onturis.prCanopyCoverTrees].lits)+"%";	
	}	
	// especies (teselas de monte)
	if (tesela.especies != undefined) {
		var spuris = _.keys(tesela.especies);
		var filas = [];
		_.each(spuris, function(spuri) {
			if (Datinv.especies[spuri] != undefined) {					
				var nesp = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prVulgarName].lits, uriToLiteral(spuri)));
				// si hay nombre científico...
				if (Sesion.nomci) {
					nesp = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prScientificName].lits,
						nesp));
					// en cursiva
					nesp = '<i>' + nesp + '</i>';
				}
				// si hay especies seleccionadas, ajusto formateo si procede
				if (Sesion.espfilturis.length > 0) {
					var incs = [];
					_.each(Sesion.espfilturis, function(espuri, ind) {
						if (spuri === espuri) // coincidencia!
							nesp = '<strong>' + nesp + '</strong>';
						else if (_.contains(Datinv.especies[espuri].expuris, spuri)) {
						//else if (_.contains(Sesion.espfilturisexp[ind], spuri)) {
							// coincidencia en la lista expandida de especies
							incs.push(espuri);						
						}					
					});
					// formateo las coincidencias en las listas expandidas de especies
					if (incs.length > 0) {
						nesp += ' ('
						_.each(incs, function(espuri2) {
							var nesp2 = firstUppercase(getLiteral(Datinv.especies[espuri2][onturis.prVulgarName].lits, uriToLiteral(espuri2)));
							// si hay nombre científico...
							if (Sesion.nomci) {
								nesp2 = firstUppercase(getLiteral(Datinv.especies[espuri2][onturis.prScientificName].lits,
									nesp2));
								// en cursiva
								nesp2 = '<i>' + nesp2 + '</i>';
							}
							// incluyo nombre especie 2
							nesp += '<strong>' + nesp2  + '</strong>, ';
						});
						// reemplazo final...
						nesp += ')';						
						nesp = nesp.replace(", )", ")");
					}
				}				
				// preparo fila
				var vinf = 10*Math.floor(tesela.especies[spuri]/10);
				var vsup = 10*Math.ceil(tesela.especies[spuri]/10);
				var vtexto = vinf == vsup? vsup + "%" : vinf + "-" + vsup + "%";
				var fila = {
					porc: tesela.especies[spuri],
					texto: "<br> - " + nesp + ": " + vtexto,
				}
				// incluyo fila
				filas.push(fila);
			}
		});
		if (filas.length > 0) {
			texto +=  "<br>" + getLiteral(dict.speciesinfo) + ":";
			// ordeno filas por porcentaje
			filas = _.sortBy(filas, 'porc').reverse();
			_.each(filas, function(fila) {
				texto += fila.texto;
			})
		}
	}
	return texto;
}


function pintarTeselasBox(pbox) {
	// obtengo bounding box del mapa
	var bounds = Map.getBounds();
	// calculo el área de un píxel para quitar agujeros si hace falta
	var ancho = Math.round(bounds.getNorthWest().distanceTo(bounds.getNorthEast()));
	var alto = Math.round(bounds.getNorthWest().distanceTo(bounds.getSouthWest())); 
	var area = ancho * alto;
	var size = Map.getSize(); // pixeles en "x" y en "y"
	var areapixel = Math.round( area / (size.x*size.y) );
	
	// sólo pinto las teselas con al menos cierta área en píxeles
	//var areamin = config.minpixelspatch*areapixel; // esto ya se comprueba en el dataManager
	var areaminagujero = config.minpixelshole*areapixel;
	if (areaminagujero > config.maxareaminhole)
		areaminagujero = config.maxareaminhole; // saturo área del agujero
		
	// ¿cuántas teselas hay pintadas en la capa?	
	var npatches = _.keys(Sesion.tessPintadas).length;
	
	//console.log("#teselas totales: " + mfvall.features.length);
	
	// obtengo la lista de teselas a pintar
	var patches = []; // teselas a pintar
	
	// preparo teselas en GeoJSON
	_.each(pbox, function(turi) {
		var otes = Datinv.teselas[turi];
		var opol = Datinv.poligonos[otes.poly];
		// inicializo objeto
		var patch = {
			"type": "Feature",
			"properties" : {}		
		};
		// uri
		patch.properties.uri = turi;
		// área
		if (opol.area != undefined)
			patch.properties.Shape_Area = opol.area;
	
		// preparo nueva geometría sin agujeros de al menos areaminagujero
		var ngeo = {
			type: opol.geometry.type,
			coordinates: []
		};
		// reviso polígonos de la geometría
		if (opol.geometry != null && opol.geometry.type === "Polygon") {			
			for (var inda=0; inda<opol.geometry.coordinates.length; inda++) {
				// obtengo polígono
				var pol = opol.geometry.coordinates[inda];
				// si es el 0, adentro
				if (inda == 0)
					ngeo.coordinates.push(pol);
				else { // el agujero va dentro sólo si tiene un área mayor a areaminagujero
					var pbounds = L.polygon(pol).getBounds();
					var anchopol = pbounds.getNorthWest().distanceTo(pbounds.getNorthEast());
					var altopol = pbounds.getNorthWest().distanceTo(pbounds.getSouthWest());
					var areapol = anchopol * altopol;
					if (areapol > areaminagujero)
						ngeo.coordinates.push(pol);
				}
			}
			// guardo agujeros
			patch.properties.agujeros = ngeo.coordinates.length - 1;
		}
		else if (opol.geometry != null && opol.geometry.type === "MultiPolygon") {
			var agujeros = 0;
			for (var inda=0; inda<opol.geometry.coordinates.length; inda++) {
				var mpol = opol.geometry.coordinates[inda];				
				// creo mpol vacío
				ngeo.coordinates.push([]);					
				for (var indb=0; indb<mpol.length; indb++) {
					// obtengo polígono
					var pol = mpol[indb];
					// si es el 0, adentro
					if (indb == 0)
						ngeo.coordinates[inda].push(pol);
					else { // el agujero va dentro sólo si tiene un área mayor a areaminagujero
						var pbounds = L.polygon(pol).getBounds();
						var anchopol = pbounds.getNorthWest().distanceTo(pbounds.getNorthEast());
						var altopol = pbounds.getNorthWest().distanceTo(pbounds.getSouthWest());
						var areapol = anchopol * altopol;
						if (areapol > areaminagujero)
							ngeo.coordinates[inda].push(pol);
					}
				}
				// actualizo agujeros
				agujeros += mpol.length - 1;
			}
			// guardo agujeros
			patch.properties.agujeros = agujeros;
		}
		// una vez preparada le enchufo la nueva geometría
		patch.geometry = ngeo;
				
		// TESELA LISTA EN GEOJSON	
		// si no estaba pintada, la guardo en patches
		if (Sesion.tessPintadas[turi] == undefined)
			patches.push(patch);
		else {
			// estaba pintada, compruebo si no coincide el número de agujeros
			if (Sesion.tessPintadas[turi].feature.properties.agujeros != patch.properties.agujeros) {
				// borro la tesela que estaba pintada
				Tess.removeLayer(Sesion.tessPintadas[turi]);
				delete Sesion.tessPintadas[turi];
				// incluyo patch en patches para pintarla en cualquier caso
				patches.push(patch);
			}
			// si ya estaba pintada como quería no hago más
		}
	});
	
	// actualizo color de las teselas ya pintadas
	ajustarColorTeselas(pbox, false);

	// actualizo popups de las teselas ya pintadas
	ajustarPopupsTeselas(pbox, false);
	
	// por último, pinto las teselas y guardo la referencia a las teselas pintadas
	Tess.addData(patches);
	// preparo nueva forma de guardar
	_.each(Tess.getLayers(), function(layer) {
		var uri = layer.feature.properties.uri;
		if (Sesion.tessPintadas[uri] == undefined)
			Sesion.tessPintadas[uri] = layer;
	});
		
	// y mando la capa de teselas al fondo
	Tess.bringToBack();
}

function ajustarColorTeselas(turis, todas) { // todas o sólo monte
	// ajusto color tesela a tesela
	_.each(turis, function(turi) {
		//var uuri = Datinv.teselas[turi][onturis.prHasUsage].ovals[0];	
		if (Sesion.tessPintadas[turi] != undefined && (todas ||
				_.intersection(Datinv.usos[onturis.forestuse].expuris, Datinv.teselas[turi].types).length > 0) ) {
			// obtengo colores y ajusto estilo
			var colint = colorTesela(Datinv.teselas[turi], false);
			var colext = colorTesela(Datinv.teselas[turi], true);
			Sesion.tessPintadas[turi].setStyle( {fillColor: colint, color: colext} );			
		}
	});
}

function ajustarPopupsTeselas(turis, todas) {
	// ajusto popup tesela a tesela (si son de monte, las del resto no cambian)
	_.each(turis, function(turi) {
		//var uuri = Datinv.teselas[turi][onturis.prHasUsage].ovals[0];	
		if (Sesion.tessPintadas[turi] != undefined && (todas ||
				_.intersection(Datinv.usos[onturis.forestuse].expuris, Datinv.teselas[turi].types).length > 0) ) {
			// obtengo texto del popup
			var texto = popupTesela(Datinv.teselas[turi]);
			// y se lo enchufo
			Sesion.tessPintadas[turi].bindPopup(texto);				
		}
	});
}

function quitarTeselas() {
	// borro la capa de teselas
	Tess.clearLayers();
	// inicializo la lista de teselas pintadas
	Sesion.tessPintadas = {};	
}