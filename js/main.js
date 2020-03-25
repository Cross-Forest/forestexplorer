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

// inicializo provincias y objetos cacheados
var provs;
var cachedQueries = {};

// espero a que esté el documento listo para empezar
$(document).ready( function() {
	// pongo el título en el idioma correspondiente
	$("title").html(getLiteral(dict.title));

	// cargamos las consultas cacheadas
	console.group("Precarga de ficheros");
	$.ajax({
		dataType: "json",
		url: "etc/data/countallspeciestreesprov_comp.json",
		mimeType: "application/json",
		success: function(datos) {
			// obtengo las provincias descomprimidas
			cachedQueries.countallspeciestreesprov = JSON.parse( LZString.decompress(datos) );			
			console.log('Datos de la consulta "countallspeciestreesprov" cargados');
		}
	});
	$.ajax({
		dataType: "json",
		url: "etc/data/countallspeciesplotsprov_comp.json",
		mimeType: "application/json",
		success: function(datos) {
			// obtengo las provincias descomprimidas
			cachedQueries.countallspeciesplotsprov = JSON.parse( LZString.decompress(datos) );			
			console.log('Datos de la consulta "countallspeciesplotsprov" cargados');
		}
	});
	$.ajax({
		dataType: "json",
		url: "etc/data/counttreesspecies_comp.json",
		mimeType: "application/json",
		success: function(datos) {
			// obtengo las provincias descomprimidas
			cachedQueries.counttreesspecies = JSON.parse( LZString.decompress(datos) );			
			console.log('Datos de la consulta "counttreesspecies" cargados');
		}
	});
	
	// cargamos las provincias
	$.ajax({
		dataType: "json",
		url: "etc/data/provincias_comp.json",
		mimeType: "application/json",
		success: function(datos) {
			// obtengo las provincias descomprimidas
			provs = JSON.parse( LZString.decompress(datos) );			
			console.log('Datos del fichero de provincias cargados');
			// inicialización
			inicializar();
		}
	});
});

	
// INICIALIZACIÓN APLICACIÓN
function inicializar() {	
	// INICIALIZAMOS DATOS SESIÓN
	Sesion = {};
	
	// inicializo timeouts
	Sesion.timeout = config.timeout;
	Sesion.huboTimeout = false;	
	
	// inicializo lugares sugerencias
	Sesion.lugarfocus = -1;
	Sesion.lugar = null; // lugar seleccionado (si lo hay)
	Sesion.lugarmarker  = null; // marcador de lugar inicialmente a null
	
	// inicializo modo según configuración
	if (config.initMostrarProvs) {	
		Sesion.modo = 'PROV';
		Sesion.mostrarprovs = true;
	}
	else {
		Sesion.modo = 'NOPARC';
		Sesion.mostrarprovs = false;
	}
	
	// inicializo mostrar parcelas
	Sesion.mostrarparcs = true;
	
	// inicializo nombres científicos a false
	Sesion.nomci = config.initNomci;
	
	// inicializo usos teselas filtrados
	Sesion.hayusos = false;
	Sesion.usofilturis = [];
	
	// inicializo especies filtradas
	Sesion.espfilturis = [];
	Sesion.espfiltcolinds = [];
	// inicializo especies sugerencias
	Sesion.espfocus = -1;
	
	// inicializo las áreas mínimas de las teselas para cada nivel de zoom
	Sesion.tessAreaminZoom = {};
	// inicializo las teselas pintadas
	Sesion.tessPintadas = {};	
	// inicializo las parcelas pintadas
	Sesion.parcsPintadas = {};
	Sesion.radioParcsPintadas = config.radioParcela; // 300 metros de radio por defecto
	Sesion.parbsPintadas = {};
	// inicializo los árboles pintados
	Sesion.arbsPintados = {};
	
	// bloqueo para pintar
	Sesion.actualizandoMapa = false; // bloqueo si se está actualizando el mapa
	Sesion.mapaMovido = false; // detecto si el mapa se movió para actualizar
	Sesion.idTimeoutActualizar = null; // id del timeout para actualización automática (para que no se bloquee)
	
	// muestro tooltips si no es un touchscreen
	Sesion.hayTooltips = 'ontouchstart' in window? false : true;
	
	// inicializamos DBpedia a no disponible
	Sesion.dbpediaDisp = false; // probamos luego si está disponible
	
	Sesion.panelContraido = false; // inicialmente muestro el panel completo
	
	
	// INICIALIZO DATOS INVENTARIO
	Datinv = {};
	Datinv.especies = {};
	Datinv.infoEspecies = {}; // TODO probando
	Datinv.arboles = {};
	Datinv.parcelas = {};
	Datinv.boxesParcelas = [];
	Datinv.teselas = {};
	Datinv.poligonos = {};
	Datinv.boxesTeselas = {};
	Datinv.usos = {};		
	
	
	// INICIALIZO PROVEEDOR DE DATOS
	// configuro y pruebo endpoint por defecto	
	console.group("Inicialización punto SPARQL");
	configurarEndpoint(0, obtenerDatosInicialesInventario);
		
	// configuro y pruebo endpoint DBpedia
	configurarDBpedia();	
	
	// CARGO MAPA CENTRADO EN ESPAÑA	
	Map = L.map('mapid', {zoomControl: false} ).setView(config.geolocstart, config.zStart);
	// valorar si incluir otro valor para wheelDebounceTime (ej. 200 ms):
	//Map = L.map('mapid', {zoomControl: false, wheelDebounceTime: 200} ).setView(config.geolocstart, config.zStart);
	L.tileLayer(config.geotemplate, config.geooptions).addTo(Map);
	
	// REPOSICIONO CONTROLES DE ZOOM Y MUESTRO ESCALA DEL MAPA
	L.control.scale( {imperial: false, position: 'bottomright'} ).addTo(Map); // sin la escala imperial
	L.control.zoom( { position: 'bottomright',
		zoomInTitle: getLiteral(dict.zoomin),
		zoomOutTitle: getLiteral(dict.zoomout),
	} ).addTo(Map);
	
	// INCLUYO BOTÓN DE MI LOCALIZACIÓN CON Leaflet.Locate (ver https://github.com/domoritz/leaflet-locatecontrol)
	L.control.locate({
	    position: 'bottomright',
	    icon: 'fa fa-street-view',
		locateOptions: { maxZoom: config.zCambioRadio, animate: true, duration: 1 },
	    flyTo: true,
	    showPopup: false,
    	strings: {
        	title: getLiteral(dict.mylocation)
	    }
	}).addTo(Map);
	// capturo click en botón my location
	$( "a[title='My location']" ).click(function(el) {
		// mando evento a GA
		sendEvent('controls', 'controls_button', 'my_location');
	});
	
							
	// INICIALIZO LayerGroup DE TESELAS
	Tess = inicializarTeselas();		
	// INICIALIZO LayerGroup DE PARCELAS
	Parcs = L.layerGroup().addTo(Map);
	// INICIALIZO LayerGroup DE ÁRBOLES
	Arbs = L.layerGroup().addTo(Map);

	// DETECCIÓN DE CAMBIOS EN EL MAPA
	Map.on('moveend', mapaMovido);	
	
	// GENERO ICONOS
	generaIconos();	
		
	// INICIALIZO PANEL Y CARGAMOS PROVINCIAS	
	// cargar panel de control
	cargarPanel();
	
	// spinner de inicializando
	ponerSpinner(true, getLiteral(dict.spinnerInit));
		
	// cargamos provincias (sin datos) como preinicialización
	if (Sesion.modo === 'PROV')
		cargarProvincias();
			
	// CONFIGURAR SOLR
	console.group("Inicialización motor de texto");
	console.time("Configuración motor de texto");	
	configurarSolr(0);
	
	// INICIALIZACIÓN CUESTIONARIO
	// variables en localStorage
	// timestampPrimeraSesion: timestamp de la primera vez que utilizó el explorador (o que pulsó el botón más tarde)
	// cuestionarioNo: no mostrar más el cuestionario
	// si no había, guardo timestamp primera sesión
	if (localStorage.getItem('timestampPrimeraSesion') == undefined)
		localStorage.setItem('timestampPrimeraSesion', Date.now());
	// detecto si debo mostrar el cuestionario en la sesión
	var gapinicio = Date.now() - localStorage.getItem('timestampPrimeraSesion');
	if (gapinicio > config.interSessionQGap && localStorage.getItem('cuestionarioNo') == undefined) {
		Sesion.ponerAlertaCuestionario = true; // puede ponerse el cuestionario en la sesión
		Sesion.inicioSesion = Date.now(); // guardo inicio sesión
	}
	else
		Sesion.ponerAlertaCuestionario = false;
}
// ENDPOINT
function configurarEndpoint(indep, succesCallback) {
	// ¿hay endpoint para configurar?
	if (indep >= config.endpoints.length) {
		console.error("No hay más endpoints para utilizar... (!!!)");
		console.groupEnd();		
		// mando evento a GA
		if (config.endpoints.length > 0) // sólo si había algún endpoint para configurar (mando último)
			sendEvent('init', 'init_endpoint_KO', config.endpoints[config.endpoints.length - 1]);		
		// aviso de que ya no se puede explorar el inventario
		errorEndpoint();
	}
	else {
		console.log("Probando el endpoint #" + indep +": " + config.endpoints[indep]);
		// configuro el endpoint
		DataProv = new DataProvider(config.endpoints[indep], "GET", config.graph,
			function(jqXHR, status, errorThrown) {
				console.error("ERROR ENDPOINT!!!!\n"+status+"\n+"+errorThrown);
				// muestro error
				errorEndpoint();
				// quito todas las capas y muestro provincias
				quitarProvincias();
				quitarTeselas();		
				quitarParcelas();
				quitarArboles();
				cargarProvincias();
			});
		// pruebo el endpoint
		DataProv.getData('test', {}, function(datos) { // success
			// no data??
			if (datos.results.bindings.length == 0) {
				console.warn("No hay datos en el endpoint #" + indep +" (!)");
				// probamos el siguiente endpoint
				configurarEndpoint(indep + 1, succesCallback);
			}
			else {// repository working :)
				// mando evento a GA
				sendEvent('init', 'init_endpoint_OK', config.endpoints[indep]);
				
				console.info("Endpoint #" + indep + " funcionando");
				console.groupEnd();
				if (succesCallback != undefined)
					succesCallback();
			}
		}, function(jqXHR, status, errorThrown) { // error!	
			console.warn("Falló el endpoint #"+ indep +" (!)");
			// probamos el siguiente endpoint
			configurarEndpoint(indep + 1, succesCallback);
		});	
	}
}
function obtenerDatosInicialesInventario() {
	// INICIALIZACIONES PROVEEDOR DE DATOS
	console.group("Inicialización de datos");
			
	// obtengo datos de los usos para las teselas
	getUsesInfo(function() {
		console.info("Info de usos cargada");
		
		// guardo info de que hay usos
		Sesion.hayusos = true;
		
		// habilito handler de uso
		$("#bot_filtrar_uso").click(handlerFiltrarUsos);
	});
	
	// obtengo datos de todas las especies	
	console.time("Carga de datos de especies");
	getSpeciesInfo(function() {
		console.info("Info de especies cargada");
		console.timeEnd("Carga de datos de especies");
		console.groupEnd();
		// habilito el botón de filtrar por especie (desactivado hasta ahora)
		$("#bot_filtrar_especie").removeAttr('disabled');
		
		// una vez que tengo las especies, intento procesar "countallspeciesplotsprov"
		// si es que está cacheada
		processCountAllSpeciesPlotsProv();
	});
	
	// AQUÍ SE HACE LA PRIMERA ACTUALIZACIÓN COMPLETA DEL MAPA
	actualizarMapa(true);
}
function errorEndpoint() {
	// ya no tiene sentido pedir datos para actualizar el mapa
	Sesion.errordataprov = true; 
	// pongo un modal para avisar de que no se puede explorar el inventario
	var $modal = $(errorEndpointTemplate);
	$("body").append($modal); 
	$("#errorEndpointModal").modal('show');
	// quito spinner
	ponerSpinner(false);
	// y quito temporizador
	finActualizarMapa();
}


// CONFIG DBPEDIA
function configurarDBpedia() {
	console.log("Probando el endpoint de DBpedia: " + config.dbpediaEndpoint);
	// configuro el endpoint
	DBpediaProv = new DataProvider(config.dbpediaEndpoint, "GET", config.dbpediaGraph,
		function(jqXHR, status, errorThrown) {
			console.error("ERROR ENDPOINT DBPEDIA!!!!\n"+status+"\n+"+errorThrown);
		});
	// pruebo el endpoint
	DBpediaProv.getData('test', {}, function(datos) { // success
		// no data??
		if (datos.results.bindings.length == 0) {
			console.error("No hay datos en el endpoint de DBpedia (!)");
			// mando evento a GA
			sendEvent('init', 'init_dbpedia_KO', config.dbpediaEndpoint);
		}
		else {// repository working :)
			console.info("Endpoint de DBpedia funcionando");
			// dbpedia disponible
			Sesion.dbpediaDisp = true;
			// mando evento a GA
			sendEvent('init', 'init_dbpedia_OK', config.dbpediaEndpoint);
		}
	}, function(jqXHR, status, errorThrown) { // error!	
		console.error("Falló el endpoint de DBpedia (!)");
		// mando evento a GA
		sendEvent('init', 'init_dbpedia_KO', config.dbpediaEndpoint);
	});	
}



// CONFIG SOLR
function configurarSolr(inds) {
	// ¿hay solr para configurar?
	if (inds >= config.solrPaths.length) {
		console.error("No hay más motores de texto para utilizar... (!!!)");
		console.groupEnd();
		// escondo el cajetín de búsqueda de lugares
		esconderEntradaLugares();
		console.timeEnd("Configuración motor de texto");
		console.groupEnd();
		// mando evento a GA
		if (config.solrPaths.length > 0) // sólo si había algún solr para configurar (mando último)
			sendEvent('init', 'init_solr_KO', config.solrPaths[config.solrPaths.length - 1]);
	}
	else {
		console.log("Probando motor de texto #" + inds +": " + config.solrPaths[inds]);
		// creo el proveedor de sugerencias
		SugeProv = new PlaceSuggesterProvider(config.solrPaths[inds] + config.suggestHandler,
			function(jqXHR, status, errorThrown) {
				console.error("ERROR SOLR!!!!\n"+status+"\n+"+errorThrown);
		});
		// lo pruebo
		SugeProv.probar(
			function() {
				console.info("Motor de texto #" + inds +" - sugerencias funcionando");
				// creo el proveedor de lugares
				LugaresProv = new PlaceSelectionProvider(config.solrPaths[inds] + config.selectHandler,
					function(jqXHR, status, errorThrown) {
						console.error("ERROR!!!!\n"+status+"\n+"+errorThrown);
				});
				// lo pruebo
				LugaresProv.probar(
					function() {
						// OK!
						console.info("Motor de texto #" + inds +" - lugares funcionando");
						console.timeEnd("Configuración motor de texto");
						console.groupEnd();
						// mando evento a GA
						sendEvent('init', 'init_solr_OK', config.solrPaths[inds]);
					},
					function() {
						console.warn("Falló el motor de texto #"+ inds +" - lugares (!)");
						// probamos el siguiente solrpath
						configurarSolr(inds + 1);
					}
				);
			}, 
			function() {
				console.warn("Falló el motor de texto #"+ inds +" - sugerencias (!)");
				// probamos el siguiente solrpath
				configurarSolr(inds + 1);
			}
		);
	}
}
function esconderEntradaLugares() {
	$('#lugares_heading').addClass("d-none");
}


// BUCLE DE CONTROL DEL MAPA
function mapaMovido() {
	if (Sesion.errordataprov == undefined) {
		if (Sesion.actualizandoMapa) {
			Sesion.mapaMovido = true; // pendiente de actualizar el mapa...
			console.log("Mapa movido: actualización de mapa pendiente...");
		}
		else {
			// obtengo zoom
			var zoom = Map.getZoom();
			// obtengo nuevo modo
			var nmodo = zoom < config.zParcela? 'NOPARC' : zoom < config.zArbol? 'PARC' : 'ARB';
			if (nmodo === 'NOPARC' && Sesion.mostrarprovs)
				nmodo = 'PROV';
			// detecto si cambió el modo
			var cambiomodo = !(Sesion.modo === nmodo);
			// guardo nuevo modo
			Sesion.modo = nmodo;
			// llamo a actualizar el mapa
			actualizarMapa(cambiomodo);
		}
	}
}
function ajustarControlesPanel() {
	// sólo si está el panel de control expandido
	if (!Sesion.panelContraido) {
		if (Sesion.modo === 'PROV') { 
			$("#usos").addClass("d-none");
			$("#colorsat").addClass("d-none");
			$("#spanswitchprovs").removeClass("d-none");
			$("#spanswitchplots").addClass("d-none");
		}
		else if (Sesion.modo === 'NOPARC') {
			if (Sesion.hayusos)	
				$("#usos").removeClass("d-none");
			else
				$("#usos").addClass("d-none");
			$("#colorsat").addClass("d-none");
			$("#spanswitchprovs").removeClass("d-none");
			$("#spanswitchplots").addClass("d-none");
		}
		else {		
			if (Sesion.hayusos)	
				$("#usos").removeClass("d-none");
			else
				$("#usos").addClass("d-none");		
			$("#spanswitchprovs").addClass("d-none");
			// color de saturación y botón de mostrar parcelas
			if (Sesion.modo === 'PARC') { // aquí aplican estos controles
				$("#spanswitchplots").removeClass("d-none");
				if (Sesion.mostrarparcs)
					$("#colorsat").removeClass("d-none");
				else
					$("#colorsat").addClass("d-none");
			}
			else if (Sesion.modo === 'ARB') {// aquí no
				$("#colorsat").addClass("d-none");
				$("#spanswitchplots").addClass("d-none");
			}
		}
	}
}
function actualizarMapa(cambiomodo) {
	inicioActualizarMapa();
	var idtimeout = Sesion.idTimeoutActualizar;
	var modo = Sesion.modo;
	
	// ajusto controles que aplican o no según el modo
	ajustarControlesPanel();
	
	// primero obtengo datos, luego el rendering
	if (modo === 'PROV') { // aquí sólo muestro provincias
		// voy quitando las capas más inferiores					
		quitarParcelas();
		quitarArboles();
		// tomo tiempos carga de datos provincias
		console.time("Carga de datos de provincias I" + idtimeout);
		// obtengo los árboles por especies de las provincias
		countAllSpeciesTreesProvs(function() {
			// obtengo num de parcelas total
			countPlotsProvs(function() {
				// obtengo num de parcelas con algún árbol por provincia para cada especie seleccionada
				countSpeciesPlotsProvs(Sesion.espfilturis, function() {
					// obtengo información de existencias de especies por provincia
					getInfoSpeciesProvs(function() {
						// DATOS LISTOS
						console.timeEnd("Carga de datos de provincias I" + idtimeout);
						// sólo hago el rendering si me toca (idtimeout es el mismo que Sesion.idTimeoutActualizar)
						if (idtimeout == Sesion.idTimeoutActualizar) {
							// spinner de pintar provincias
							ponerSpinner(true, getLiteral(dict.spinnerRenderingProvs));				
							// quito capa de teselas
							quitarTeselas();
							// pongo capa de provincias si no la tenía
							if (cambiomodo) {
								console.time("Pintado de provincias I" + idtimeout);
								quitarProvincias();
								cargarProvincias();
								console.timeEnd("Pintado de provincias I" + idtimeout);
							}
							else // reajusto colores y tooltips si ya estaba
								ajustarColorTooltipsProvincias();
							// rutina fin actualización del mapa
							finActualizarMapa();
						}
					});
				});
			});
		});
	}
	else if (modo === 'NOPARC')  { // aquí sólo muestro teselas
		// voy quitando las capas más inferiores					
		quitarParcelas();
		quitarArboles();
		
		// obtengo el número de teselas previas para los estadísticos
		var ntprevias = _.keys(Sesion.tessPintadas).length;
		
		// tomo tiempos carga de datos teselas
		console.time("Carga de datos teselas I" + idtimeout);
		
		// preparo objeto que circulará para el procesamiento
		var objt = {};
		objt.idtimeout = idtimeout;
		objt.nd = 2; // número de dígitos para las coordenadas del lienzo
		objt.boxes = []; // array con cada uno de los boxes a solicitar teselas
		objt.cargaDatos = cargarDatosTeselasBox;
		objt.primerRender = true;
		objt.render = function(objt, indbox, indpag) {
			// DATOS LISTOS DE LA PÁGINA DEL BOX CORRESPONDIENTE
			var mibox = objt.boxes[indbox];
			var mipag = mibox.pags[indpag];
			mibox.npagscargadas++;
			// obtengo turis de todo el box si tengo todas las páginas
			// y si llegaron todos los boxes guardo las turis del box completo
			if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagscargadas) {						
				// guardo las turis	de todas las páginas del box
				mibox.turis = [];
				for (var ind=0; ind < mibox.pags.length; ind++)
					mibox.turis = mibox.turis.concat(mibox.pags[ind]);
				// guardo las turis también en objt
				if (objt.turis == undefined)
					objt.turis = mibox.turis;
				else // aquí toca hacer la unión (caro computacionalmente)
					objt.turis = _.union(objt.turis, mibox.turis);
				// box cargados
				objt.boxescargados++;				
				
				var nconsultas = _.reduce(mibox.nconsultas, function(memo, num){ return memo + num; }, 0);	
				console.info("Box I" + idtimeout + "#" + indbox + " de teselas cargado - cacheada: " + mibox.cacheada 
					+ " - #páginas: " + mibox.pags.length + " - #teselas: " + mibox.turis.length + " - #consultas: " + nconsultas);
				
				// actualizo info evento
				addMapEvent('queries', nconsultas);
				addMapEvent('patches', mibox.turis.length);
				
				// si están todos los boxes cargados, agrupamos turis y guardamos
				if (objt.boxescargados == objt.boxes.length) {					
					console.timeEnd("Carga de datos teselas I" + idtimeout);					
					console.time("Inclusión del box en la caché de teselas I" + idtimeout);
					var teselaBox = {				
						north: objt.north,
						south: objt.south,
						west: objt.west,
						east: objt.east,
						areamin: objt.areamin,
						turis: objt.turis
					};
					// creo array de boxes para el areamin si no existe
					if (Datinv.boxesTeselas[objt.areamin] == undefined) 
						Datinv.boxesTeselas[objt.areamin] = [];
					// incluyo el tesela box
					Datinv.boxesTeselas[objt.areamin] = incluirBox(Datinv.boxesTeselas[objt.areamin], teselaBox, combinarBoxesTeselas);
					// logging...
					console.timeEnd("Inclusión del box en la caché de teselas I" + idtimeout);
					console.time("Pintado de teselas I" + idtimeout);
				}			
			}
			//console.timeEnd("Carga de datos NOPARC-teselas " + idtimeout);
			// sólo hago el rendering si me toca (idtimeout es el mismo que Sesion.idTimeoutActualizar)
			if (idtimeout == Sesion.idTimeoutActualizar) {
				// DATOS LISTOS => RENDERING					
				// spinner de pintar teselas
				ponerSpinner(true, getLiteral(dict.spinnerRenderingPatches));					
				//console.time("Rendering NOPARC-teselas " + idtimeout);
				// quito capa de provincias y elimino las teselas si hubo cambio de capa
				if (objt.primerRender) {
					objt.primerRender = false;
					quitarProvincias();
					if (objt.repintar)
						quitarTeselas();
				}
				// pongo teselas de mi página del box
				pintarTeselasBox(mipag);
				mibox.npagspintadas++;
				//console.timeEnd("Rendering NOPARC-teselas " + idtimeout);			
				// si acabamos de pintar la última página de las teselas del box
				if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagspintadas) {
					// actualizo boxes pintados
					objt.boxespintados++;					
					// si terminamos de pintar, acabamos con esta rutina fin actualización
					if (objt.boxespintados == objt.boxes.length) {
						// todo pintado
						console.timeEnd("Pintado de teselas I" + idtimeout);				
						// quito teselas no incluidas si hay más de un 30% de teselas de diferencia
						var allturis = _.keys(Sesion.tessPintadas);
						var quitarturis = [];
						if (0.7*allturis.length - objt.turis.length > 0) {						
							console.time("Borrado de teselas I" + idtimeout);					
							// teselas a quitar			
							quitarturis = _.difference(allturis, objt.turis);
							_.each(quitarturis, function(quri) {
								Tess.removeLayer(Sesion.tessPintadas[quri]);
								delete Sesion.tessPintadas[quri];
							});
							//console.log("#teselas iteración: " + objt.turis.length + " - #teselas agregadas: " + allturis.length
							//	 + " - #teselas quitadas: " + quitarturis.length);
							console.timeEnd("Borrado de teselas I" + idtimeout);
						}						
						var tnuevas = allturis.length - ntprevias;
						console.info("#teselas I" + idtimeout  + " total: " + allturis.length + " - iter: " + objt.turis.length + " - #nuevas: " + 
							tnuevas + " - #borradas: " + quitarturis.length );
					
						// y termino
						finActualizarMapa();
					}				
				}
			}
		};		
		// obtengo datos de las teselas, luego cargaDatos y por último render
		getPatchesInBox(objt);
	}
	else {	
		// aquí siempre teselas y luego parcelas/árboles (se hace parecido)
		var nrequests = 2; // peticiones de teselas y de parcelas/árboles
		var nd = 2; //var nd = modo === 'ARB'? 3 : 2; // en árboles más precisión en las boxes
		
		// obtengo el número de parcelas previas para los estadísticos
		var npprevias = 0;
		// quito capas
		if (modo === 'PARC') {
			quitarArboles();
			npprevias = _.keys(Sesion.parcsPintadas).length;
		}
		else if (modo === 'ARB') {
			quitarParcelas();
			npprevias = _.keys(Sesion.parbsPintadas).length;
		}

		//
		// TESELAS
		//
		// obtengo el número de teselas previas para los estadísticos
		var ntprevias = _.keys(Sesion.tessPintadas).length;
		// tomo tiempos carga de datos teselas
		console.time("Carga de datos teselas I" + idtimeout);
		// preparo objeto que circulará para el procesamiento de teselas
		var objt = {};
		objt.idtimeout = idtimeout;
		objt.nd = nd; // número de dígitos para las coordenadas del lienzo
		objt.boxes = []; // array con cada uno de los boxes a solicitar teselas
		objt.cargaDatos = cargarDatosTeselasBox;
		objt.primerRender = true;
		objt.render = function(objt, indbox, indpag) {
			// DATOS LISTOS DE LA PÁGINA DEL BOX CORRESPONDIENTE
			var mibox = objt.boxes[indbox];
			var mipag = mibox.pags[indpag];
			mibox.npagscargadas++;
			// obtengo turis de todo el box si tengo todas las páginas
			// y si llegaron todos los boxes guardo las turis del box completo
			if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagscargadas) {						
				// guardo las turis	de todas las páginas del box
				mibox.turis = [];
				for (var ind=0; ind < mibox.pags.length; ind++)
					mibox.turis = mibox.turis.concat(mibox.pags[ind]);
				// guardo las turis también en objt
				if (objt.turis == undefined)
					objt.turis = mibox.turis;
				else // aquí toca hacer la unión (caro computacionalmente)
					objt.turis = _.union(objt.turis, mibox.turis);
				// box cargados
				objt.boxescargados++;
				
				var nconsultas = _.reduce(mibox.nconsultas, function(memo, num){ return memo + num; }, 0);	
				console.info("Box I" + idtimeout + "#" + indbox + " de teselas cargado - cacheada: " + mibox.cacheada 
					+ " - #páginas: " + mibox.pags.length + " - #teselas: " + mibox.turis.length + " - #consultas: " + nconsultas);
				
				// actualizo info evento
				addMapEvent('queries', nconsultas);
				addMapEvent('patches', mibox.turis.length);
				
				// si están todos los boxes cargados, agrupamos turis y guardamos
				if (objt.boxescargados == objt.boxes.length) {					
					console.timeEnd("Carga de datos teselas I" + idtimeout);					
					console.time("Inclusión del box en la caché de teselas I" + idtimeout);					
					var teselaBox = {				
						north: objt.north,
						south: objt.south,
						west: objt.west,
						east: objt.east,
						areamin: objt.areamin,
						turis: objt.turis
					};
					// creo array de boxes para el areamin si no existe
					if (Datinv.boxesTeselas[objt.areamin] == undefined) 
						Datinv.boxesTeselas[objt.areamin] = [];
					// incluyo el tesela box
					Datinv.boxesTeselas[objt.areamin] = incluirBox(Datinv.boxesTeselas[objt.areamin], teselaBox, combinarBoxesTeselas);
					// logging...
					console.timeEnd("Inclusión del box en la caché de teselas I" + idtimeout);
					console.time("Pintado de teselas I" + idtimeout);
				}			
			}
			//console.timeEnd("Carga de datos NOPARC-teselas " + idtimeout);
			// sólo hago el rendering si me toca (idtimeout es el mismo que Sesion.idTimeoutActualizar)
			if (idtimeout == Sesion.idTimeoutActualizar) {
				// DATOS LISTOS => RENDERING					
				// spinner de pintar teselas
				ponerSpinner(true, getLiteral(dict.spinnerRenderingPatches));					
				//console.time("Rendering NOPARC-teselas " + idtimeout);
				// quito capa de provincias y elimino las teselas si hubo cambio de capa
				if (objt.primerRender) {
					objt.primerRender = false;
					quitarProvincias();					
					if (objt.repintar)
						quitarTeselas();
				}
				// pongo teselas de mi página del box
				pintarTeselasBox(mipag);
				mibox.npagspintadas++;
				//console.timeEnd("Rendering NOPARC-teselas " + idtimeout);			
				// si acabamos de pintar la última página de las teselas del box
				if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagspintadas) {
					// actualizo boxes pintados
					objt.boxespintados++;					
					// si terminamos de pintar, acabamos con esta rutina fin actualización
					if (objt.boxespintados == objt.boxes.length) {
						// todo pintado
						console.timeEnd("Pintado de teselas I" + idtimeout);					
						// quito teselas no incluidas si hay más de un 30% de teselas de diferencia
						var allturis = _.keys(Sesion.tessPintadas);
						var quitarturis = [];
						if (0.7*allturis.length - objt.turis.length > 0) {						
							console.time("Borrado de teselas I" + idtimeout);					
							// teselas a quitar			
							quitarturis = _.difference(allturis, objt.turis);
							_.each(quitarturis, function(quri) {
								Tess.removeLayer(Sesion.tessPintadas[quri]);
								delete Sesion.tessPintadas[quri];
							});
							//console.log("#teselas iteración: " + objt.turis.length + " - #teselas agregadas: " + allturis.length
							//	 + " - #teselas quitadas: " + quitarturis.length);
							console.timeEnd("Borrado de teselas I" + idtimeout);
						}						
						var tnuevas = allturis.length - ntprevias;
						console.info("#teselas I" + idtimeout  + " total: " + allturis.length + " - iter: " + objt.turis.length + " - #nuevas: " + 
							tnuevas + " - #borradas: " + quitarturis.length );
					
						// una petición menos...
						nrequests--;
						if (nrequests <= 0) // rutina fin actualización del mapa
							finActualizarMapa();
						else // actualizo texto spinner
							ponerSpinner(true, getLiteral(dict.spinnerData));
					}				
				}
			}
		};
		// obtengo datos de las teselas, luego cargaDatos y por último render
		getPatchesInBox(objt);


		//
		// PARCELAS/ÁRBOLES
		//
		// si no hay que pintar parcelas...
		if (modo === 'PARC' && !Sesion.mostrarparcs) {			
			// quito las parcelas
			quitarParcelas();
			// una petición menos
			nrequests--;
			if (nrequests <= 0) // rutina fin actualización del mapa
				finActualizarMapa();
			return;
		}		
		
		// tomo tiempos carga de datos parcelas/árboles
		console.time("Carga de datos parcelas I" + idtimeout);
		// preparo objeto que circulará para el procesamiento de teselas
		var objp = {};
		objp.idtimeout = idtimeout;
		objp.nd = nd; // número de dígitos para las coordenadas del lienzo
		objp.boxes = []; // array con cada uno de los boxes a solicitar parcelas/arboles
		objp.cargaDatos = []; // aquí será un array...
		objp.cargaDatos.push(cargarDatosParcelasBox); // siempre pido los datos de las parcelas
		if (modo === 'ARB') { // y en árbol pido más cosas...
			objp.cargaDatos.push(getTreesInBox);
			objp.cargaDatos.push(getTreeTypesInBox);
			objp.cargaDatos.push(getTreeMeasuresInBox);
		}		
		objp.primerRender = true;
		objp.render = function(objp, indbox, indpag) {
			// DATOS LISTOS DE LA PÁGINA DEL BOX CORRESPONDIENTE
			var mibox = objp.boxes[indbox];
			var mipag = mibox.pags[indpag];
			mibox.npagscargadas++;			
			// obtengo puris de todo el box si tengo todas las páginas
			// y si llegaron todos los boxes guardo las puris del box completo
			if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagscargadas) {						
				// guardo las puris	de todas las páginas del box
				mibox.puris = [];
				for (var ind=0; ind < mibox.pags.length; ind++)
					mibox.puris = mibox.puris.concat(mibox.pags[ind]);
				// guardo también todas las puris en objp
				if (objp.puris == undefined)
					objp.puris = mibox.puris;
				else // aquí toca hacer la unión (caro computacionalmente)
					objp.puris = _.union(objp.puris, mibox.puris);
				// box cargados
				objp.boxescargados++;
				
				// logging
				var nconsultas = _.reduce(mibox.nconsultas, function(memo, num){ return memo + num; }, 0);			
				console.info("Box de parcelas I" + idtimeout + "#" + indbox + " de parcelas cargado - cacheada: " + mibox.cacheada 
					+ " - #páginas: " + mibox.pags.length + " - #parcelas: " + mibox.puris.length + " - #consultas: " + nconsultas);
								
				// actualizo info evento
				addMapEvent('queries', nconsultas);
				addMapEvent('plots', mibox.puris.length);
				
				// si están todos los boxes cargados, agrupamos puris y guardamos
				if (objp.boxescargados == objp.boxes.length) {		
					// TODO logging (quitar)			
					console.timeEnd("Carga de datos parcelas I" + idtimeout);					
					console.time("Inclusión del box en la caché de parcelas I" + idtimeout);					
					var parcelaBox = {				
						north: objp.north,
						south: objp.south,
						west: objp.west,
						east: objp.east,
						puris: objp.puris
					};
					// incluyo el parcela box
					Datinv.boxesParcelas = incluirBox(Datinv.boxesParcelas, parcelaBox, combinarBoxesParcelas);
					// TODO logging (quitar)										
					console.timeEnd("Inclusión del box en la caché de parcelas I" + idtimeout);
					console.time("Pintado de parcelas I" + idtimeout);
				}			
			}
			
			// sólo hago el rendering si me toca (idtimeout es el mismo que Sesion.idTimeoutActualizar)
			if (idtimeout == Sesion.idTimeoutActualizar) {	
				// DATOS LISTOS => RENDERING	
				if (modo === 'PARC') {				
					// spinner de pintar parcelas
					ponerSpinner(true, getLiteral(dict.spinnerRenderingPlots));	
					// el rendering de la página		
					pintarParcelasBox(mipag);
				}
				else if (modo === 'ARB'){ // árboles
					// spinner de pintar árboles
					ponerSpinner(true, getLiteral(dict.spinnerRenderingTrees));
					// pongo árboles en la página
					pintarArbolesBox(mipag);
				}
				// actualizo páginas pintadas
				mibox.npagspintadas++;
							
				// rutina fin actualización de las parcelas/árboles
				// si acabamos de pintar la última página de las teselas del box...
				if (mibox.npagsfin != undefined && mibox.npagsfin == mibox.npagspintadas) {
					// actualizo boxes pintados
					objp.boxespintados++;	
					// si terminamos de pintar, acabamos con esta rutina fin actualización
					if (objp.boxespintados == objp.boxes.length) {
						// todo pintado
						console.timeEnd("Pintado de parcelas I" + idtimeout);					
						// quito parcelas/arboles no incluidos
						// sólo si hay más de un 30% de parcelas de diferencia
						var allpuris = _.keys(Sesion.parcsPintadas);
						var pborradas = 0;
						if (0.7*allpuris.length - objp.puris.length > 0) {
							console.time("Borrado de parcelas I" + idtimeout);
							var quitarpuris = _.difference(allpuris, objp.puris);
							if (modo === 'PARC') {	// parcelas
								_.each(quitarpuris, function(quri) {
									Parcs.removeLayer(Sesion.parcsPintadas[quri]);
									delete Sesion.parcsPintadas[quri];
								});							
							}
							else if (modo === 'ARB') { // árboles
								var quitararburis = [];
								// quito las parcelas (y obtengo uris de los árboles a borrar)
								_.each(quitarpuris, function(quri) {
									// quito todos los círculos del mapa
									_.each(Sesion.parbsPintadas[quri], function(circ) {
										Parcs.removeLayer(circ);
									});						
									// borro la referencia de la parcela
									delete Sesion.parbsPintadas[quri];
									// obtengo árboles a borrar
									quitararburis = _.union(quitararburis, Datinv.parcelas[quri].arbs);
								});
								// elimino los árboles
								_.each(quitararburis, function(arburi) {
									Arbs.removeLayer(Sesion.arbsPintados[arburi]);
									delete Sesion.arbsPintados[arburi];
								});
							}
							pborradas = quitarpuris.length;
							console.timeEnd("Borrado de parcelas I" + idtimeout);
						}
						var pnuevas = allpuris.length - npprevias;
						
						console.info("#parcelas I" + idtimeout  + " total: " + allpuris.length + " - iter: " + objp.puris.length + " - #nuevas: " + 
							pnuevas + " - #borradas: " + pborradas);					
					
						// una petición menos...
						nrequests--;
						if (nrequests <= 0) // rutina fin actualización del mapa
							finActualizarMapa();
						else // actualizo texto spinner
							ponerSpinner(true, getLiteral(dict.spinnerData));					
					}
				}
			}
		};
		// obtengo datos de las parcelas/árboles, luego cargaDatos y por último render
		getPlotsInBox(objp);
	}	
}
function inicioActualizarMapa() {
	// mapa actual
	Sesion.mapaMovido = false;
	// quito timeout anterior (importante llamar tras Sesion.mapaMovido = false)
	finActualizarMapa();
	// pongo bloqueo a actualizaciones
	Sesion.actualizandoMapa = true;
	// pongo timeout para que quite el bloqueo tras 10 segundos (por si acaso se bloquea indefinidamente)
	Sesion.idTimeoutActualizar = setTimeout(function(){	
		// mando evento de timeout a GA	
		sendTimeoutEvent();
		console.warn("Venció el temporizador de " +  Math.round(Sesion.timeout/1000) + " segundos antes de terminar de actualizar el mapa");
		console.groupEnd();
		Sesion.actualizandoMapa = false;
		Sesion.idTimeoutActualizar = null;
		// actualizo timeout
		Sesion.timeout += config.timeoutStep;
		Sesion.huboTimeout = true;		
		// y llamo a mapaMovido
		mapaMovido();
	}, Sesion.timeout); // era 10000
	// spinner de cargando datos
	ponerSpinner(true, getLiteral(dict.spinnerData));
	// logging
	console.group("I" + Sesion.idTimeoutActualizar + " - Actualizando mapa - modo " + Sesion.modo);
	console.time("Actualización I" + Sesion.idTimeoutActualizar);
	console.log("Temporizador actualización: " +  Math.round(Sesion.timeout/1000) + " segundos")
	//console.log(" -> bloqueando actualizaciones y poniendo temporizador antibloqueo: " + Sesion.idTimeoutActualizar);
	
	// inicializo el evento para enviar a Google Analytics
	initMapEvent();
}
function finActualizarMapa() {
	// quito spinner
	ponerSpinner(false);	
	//console.log(" -> fin de actualización del mapa, quito temporizador antibloqueo");
	Sesion.actualizandoMapa = false; // quito bloqueo		
	// cancelo timeout anterior (si existiera)
	if (Sesion.idTimeoutActualizar != null) {
		clearTimeout(Sesion.idTimeoutActualizar);
		console.timeEnd("Actualización I" + Sesion.idTimeoutActualizar);
		console.info("I" + Sesion.idTimeoutActualizar + " - Fin actualización del mapa");
		console.groupEnd();
		Sesion.idTimeoutActualizar = null;
		// actualización timeout
		if (!Sesion.huboTimeout) // si no hubo timeout, inicializo al valor inicial
			Sesion.timeout = config.timeout;
		Sesion.huboTimeout = false; // inicializo para la siguiente
		// mando evento de fin de actualización del mapa
		sendMapEvent();	
	}
	// llamo a actualizar el mapa si es necesario
	if (Sesion.mapaMovido) {
		console.info("El mapa se había movido, vuelvo a actualizar");
		mapaMovido();
	} 
	else if (Sesion.ponerAlertaCuestionario) {
		// miro si pongo el cuestionario
		var ahora = Date.now();
		if (ahora - Sesion.inicioSesion > config.intraSessionQGap) {
			// pongo el cuestionario
			$("#mapid").append(alertQuestionnaireTemplate);
			// ya no lo vuelvo a poner en la sesión
			Sesion.ponerAlertaCuestionario = false;
			// mando evento a GA
			sendEvent('feedback', 'feedback_asked', 'Alert shown');
			// y pongo los handlers de los botones
			$("#questbotyes").click(function() {
				// mando evento a GA
				sendEvent('controls', 'controls_button', 'feedbackyes');				
				// vamos al questionario (nueva pestaña)
				var questurl = $(this).attr("questurl");
				var win = window.open(questurl, '_blank');
				win.focus();
				// no más cuestionarios
				localStorage.setItem('cuestionarioNo', true);
				// quito la alerta
				$("#questalert").alert('close');
			});
			$("#questbotno").click(function() {
				// mando evento a GA
				sendEvent('controls', 'controls_button', 'feedbackno');				
				// no más cuestionarios
				localStorage.setItem('cuestionarioNo', true);
				// quito la alerta
				$("#questalert").alert('close');
			});
			$("#questbotlater").click(function() {
				// mando evento a GA
				sendEvent('controls', 'controls_button', 'feedbacklater');
				// reajusto a ahora 
				localStorage.setItem('timestampPrimeraSesion', ahora);
				// quito la alerta
				$("#questalert").alert('close');
			});		
		}
	}
}



// PANEL DE CONTROL
function cargarPanel() {
	//  panel de control de info
	//Info = L.control({'position':'topright'});
	Info = L.control({'position':'topleft'});
	Info.onAdd = function (map) {
		// creo div con clase "card" de bootstrap
		this._div = L.DomUtil.create('div', 'card');		
		return this._div;
	};
	Info.init = function () {
		//inicializo el panel
		$(".card").html(cardHtml);
		
		// ajusto los switches según los datos de la sesión
		$("#switchprovs").prop("checked", Sesion.mostrarprovs);
		$("#switchplots").prop("checked", Sesion.mostrarparcs);
		$("#switchnomci").prop("checked", Sesion.nomci);		
		
		// HANDLERS
		// icono casa
		$('#bot_home').click(function() {
			// mando evento a GA
			sendEvent('controls', 'controls_button', 'home');
			// vamos a la landing page
			window.location.href = '../';
		});
		
		// icono para contraer la tarjeta
		$('#bot_cont').click(function() {
			// mando evento a GA
			sendEvent('controls', 'controls_button', 'form_collapsed');			
			// pongo estado
			Sesion.panelContraido = true;			
			// escondo todos los elementos de la tarjeta
			$('#tarjeta').children().addClass("d-none");
			// muestro el icono contraído
			$('#icono_cont').removeClass("d-none");
			// intercambio la clase "d-flex" (no va bien con d-none)
			$('#icono_exp').removeClass("d-flex");
			$('#icono_cont').addClass("d-flex");					
			// pongo un poco de padding
			$('#tarjeta').addClass("p-1");
			// quito la clase expandedcard a la tarjeta
			$('#tarjeta').removeClass("expandedcard");
		});
		
		// icono para expandir la tarjeta
		$('#bot_exp').click(function() {
			// mando evento a GA
			sendEvent('controls', 'controls_button', 'form_expanded');
			// pongo estado
			Sesion.panelContraido = false;
			// pongo la clase expandedcard a la tarjeta
			$('#tarjeta').addClass("expandedcard");
			// padding por defecto			
			$('#tarjeta').removeClass("p-1");
			// intercambio la clase "d-flex" (no va bien con d-none)
			$('#icono_exp').addClass("d-flex");
			$('#icono_cont').removeClass("d-flex");
			// muestro todos los elementos de la tarjeta
			$('#tarjeta').children().removeClass("d-none");
			// escondo las tostadas
			$('.toast').addClass("d-none");
			// escondo el icono contraído
			$('#icono_cont').addClass("d-none");			
			// y ajusto los controles del panel
			ajustarControlesPanel();
		});		
				
		// handler de mostrar provincias
		$("#switchprovs").change(function() {
			// guardo valor
			Sesion.mostrarprovs = this.checked;
			// mando evento a GA
			if (Sesion.mostrarprovs)
				sendEvent('controls', 'controls_switch_on', 'show_provinces');
			else
				sendEvent('controls', 'controls_switch_off', 'show_provinces');			
			// si estoy en modo NOPARC o PROV, a repintar
			if (Sesion.modo === 'NOPARC' || Sesion.modo === 'PROV')
				mapaMovido();		
		});
			
		
		// handler de mostrar parcelas
		$("#switchplots").change(function() {
			// guardo valor
			Sesion.mostrarparcs = this.checked;
			// mando evento a GA
			if (Sesion.mostrarparcs)
				sendEvent('controls', 'controls_switch_on', 'show_plots');
			else
				sendEvent('controls', 'controls_switch_off', 'show_plots');
			// si estoy en modo PARC, a repintar
			if (Sesion.modo === 'PARC' || Sesion.modo === 'PROV')
				mapaMovido();		
		});
		
		
		// detecto cambios en la entrada de lugares
		// "search" es para detectar si el usuario hizo click en la X del formulario (clear button)
		$("#in_lugares").on("keyup search", function(e) {
			// trato las teclas de arriba, abajo y enter			
			if (e.which == 13) { // tecla ENTER
				// si hay municipio seleccionado voy a él, en otro caso actúo según el focus
				if (Sesion.lugarmarker != null) { // voy al municipio
					var coords = [Sesion.lugar.latitude, Sesion.lugar.longitude];	
					Map.setView(coords, config.zLugar);
				}
				else if (Sesion.lugarfocus == -1) { // ninguna sugerencia seleccionada
					// si hay al menos una sugerencia (y habilitada) voy a la primera y la activo
					if ($("#sugelugares").children(":enabled").length > 0) {
						$("#sugelugares").children(":enabled").eq(0).click();
						Sesion.lugarfocus = 0;
						ajustarLugarfocus();
					}				
				}
				else // obtengo la sugerencia y vamos a ella
					$("#sugelugares").children().eq(Sesion.lugarfocus).click();
			}
			else if (e.which == 40) { // tecla ABAJO			
				// incremento focus
				Sesion.lugarfocus++;
				ajustarLugarfocus();
			}
			else if (e.which == 38) { // tecla ARRIBA
				// decremento focus
				Sesion.lugarfocus--;
				ajustarLugarfocus();
			}
			else if (e.which != undefined) { // caso normal
				// si había marcador de municipio, lo quito
				if (Sesion.lugarmarker != null) {
					Sesion.lugarmarker.remove();
					Sesion.lugarmarker = null;
					Sesion.lugar = null;
				}
				// actúo según la entrada
				var entrada = $(this).val();
				if (entrada.length == 0) // no hay entrada
					$("#sugelugares").html("");
				else // obtengo sugerencias
					procesarSugerenciasLugares(entrada);
			}
			else {
				// caso de la X del formulario...
				var entrada = $(this).val();
				if (Sesion.lugarmarker != null && entrada.length == 0) {
					Sesion.lugarmarker.remove();
					Sesion.lugarmarker = null;
					Sesion.lugar = null;
				}			
			}
		}).focusin(function() {			
			// vuelve el focus, muestro las sugerencias
			$("#sugelugares").removeClass("d-none");
		}).focusout(function() {
			// si pierde el focus escondemos las sugerencias tras un delay
			// el delay es importante para que se pueda clickar un botón antes de eliminar las sugerencias
			setTimeout(function(){
				if (!$("#in_lugares").is(":focus")) // si vuelve el focus no escondo
					$("#sugelugares").addClass("d-none");		
					//$("#sugemunis").html("");
			}, 300);			
		});
		
		// handler de filtrar especies
		$("#bot_filtrar_especie").click(handlerFiltrarEspecies);
		
		// handler del nombre científico
		$("#switchnomci").change(handlerNombreCientifico);
		
		// si cambia el tree color saturation...
		$("#colorsatInputId").change(function() {		
			// sólo actúo en modo parcela
			if (Sesion.modo === 'PARC') {
				// // mando evento a GA
				var pcs = Number($("#colorsatInputId").val());
				sendEvent('controls', 'controls_range', 'plot_color_saturation', pcs);
				// actualizo color, pero tooltips no
				var puris = _.keys(Sesion.parcsPintadas);
				ajustarColorTooltipsParcelas(puris, false);
			}
		});
		
		// si hay tooltips activo todo lo que hay en el panel
		if (Sesion.hayTooltips)
			$('[data-toggle="tooltip"]').tooltip();
	};
	
	// incluyo el panel en el mapa
	Info.addTo(Map);
	
	// para terminales no táctiles desactivo los listeners del mapa al entrar en el panel del formulario
	if (Sesion.hayTooltips) {
		// Disable dragging, scrollWheelZoom and doubleClickZoom when user's cursor enters the element
		Info.getContainer().addEventListener('mouseover', function () {
			Map.dragging.disable();
			Map.scrollWheelZoom.disable();
			Map.doubleClickZoom.disable();
		});
		// Re-enable dragging, scrollWheelZoom and doubleClickZoom when user's cursor leaves the element
		Info.getContainer().addEventListener('mouseout', function () {
			Map.dragging.enable();
			Map.scrollWheelZoom.enable();
			Map.doubleClickZoom.enable();
		});
    }
    
    // si es terminal táctil desactivo los eventos de dragging del mapa en el panel del formulario
    if (!Sesion.hayTooltips) {
    	Info.getContainer().addEventListener('touchstart', function () {
    		Map.dragging.disable();
    	}); 
    	Info.getContainer().addEventListener('touchend', function () {
    		Map.dragging.enable();
    	});
    }   
	
	// inicializo panel
	Info.init();
}

function ponerSpinner(activar, texto) {
	if (activar) {
		// pongo texto
		$("#txtspinner").html(texto);
		// mostrar		
		$(".spinner_span").removeClass("d-none");
	}
	else	// esconder
		$(".spinner_span").addClass("d-none");
}