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
function getMoreSpecificSpecies(types) {
	if (types == undefined || types == null)
		return undefined;
	// inicializaciones
	var suri = undefined;
	var nexpuris = null;
	// evalúo cada uno de los tipos disponibles
	_.each(types, function(evtype) {
		if (Datinv.especies[evtype] != undefined && Datinv.especies[evtype].expuris != undefined) {
			// aquí tengo uno válido, miro si es mejor que lo que tenía
			if (nexpuris == null || Datinv.especies[evtype].expuris.length < nexpuris) {
				suri = evtype;
				nexpuris = Datinv.especies[evtype].expuris.length;
			}		
		}	
	});
	// devuelvo suri
	return suri;
} 


function handlerNombreCientifico() {
	// guardo valor
	Sesion.nomci = this.checked;
	
	// mando evento a GA
	if (Sesion.nomci)
		sendEvent('controls', 'controls_switch_on', 'scientific_names');
	else
		sendEvent('controls', 'controls_switch_off', 'scientific_names');
	
	//console.log("CAMBIÓ VALOR DEL SWITCH NOMBRE CIENTÍFICO: " + this.checked)
	// ¡hay que cambiar el valor de todo!
	// cambio las etiquetas de todas las especies en la lista
	$("#especies_block").find("[spuri]").each(function() {
		// obtengo la especie
		var spuri= $(this).attr("spuri");
		// nombre vulgar y científico
		var nvul = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prVulgarName].lits, 
			uriToLiteral(spuri)));
		var ncie = '<i>' + firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prScientificName].lits,
			nvul)) + '</i>';
		// hago reemplazo en el markup del botón
		var oldmarkup = $(this).html();
		var newmarkup = Sesion.nomci? oldmarkup.replace(nvul, ncie) : oldmarkup.replace(ncie, nvul);
		$(this).html(newmarkup);	
	});
	// actualizo tooltips de las especies
	if (Sesion.hayTooltips)
		$("#especies_block").find('[data-toggle="tooltip"]').tooltip();
		
	// renderizo los filtros de especies
	renderFiltrosEspecies();	
	
	// actualizo tooltips árboles y popups de los círculos
	if (Sesion.modo === 'ARB') {
		// árboles
		var turis = _.keys(Sesion.arbsPintados);
		_.each(turis, function(turi, ind) {
			var tooltip = tooltipArbol(Datinv.arboles[turi]);
			Sesion.arbsPintados[turi].bindTooltip(tooltip);	
		});
		// círculos parcelas
		if (Sesion.espfilturis.length > 0) {
			var puris = _.keys(Sesion.parbsPintadas);		
			_.each(puris, function(puri) {
				var texto = tooltipParcela(Datinv.parcelas[puri], true);
				_.each(Sesion.parbsPintadas[puri], function(circ) {
					circ.bindPopup(texto);
				});	
			});
		}
	}	
	// actualizo tooltips parcelas		
	if (Sesion.espfilturis.length > 0 && Sesion.modo === 'PARC') {
		var puris = _.keys(Sesion.parcsPintadas);
		//console.log("Rehaciendo tooltips parcelas: "+puris.length);
		_.each(puris, function(puri) {
			var tooltip = tooltipParcela(Datinv.parcelas[puri]);
			if (Array.isArray(Sesion.parcsPintadas[puri])) {
				_.each(Sesion.parcsPintadas[puri], function(ppint) {
					ppint.bindTooltip(tooltip);
				});
			}
			else 
				Sesion.parcsPintadas[puri].bindTooltip(tooltip);
		});
	}
	// en provincias...
	if (Sesion.modo === 'PROV') 
		ajustarColorTooltipsProvincias();
	else { // para las teselas actualizo los popups
		var turis = _.keys(Sesion.tessPintadas);
		ajustarPopupsTeselas(turis);
	}
}


function handlerFiltrarEspecies() {
	// obtengo nuevo estado del botón
	var activar = !$("#bot_filtrar_especie").hasClass("active");
	
	// mando evento a GA
	if (activar)
		sendEvent('controls', 'controls_button', 'filter_species_expanded');
	else
		sendEvent('controls', 'controls_button', 'filter_species_collapsed');	
		
	// pongo el botón activo o no y cambio el título del tooltip
	if (activar) {
		$("#bot_filtrar_especie").addClass("active");
		$("#bot_filtrar_especie").attr("title", getLiteral(dict.ttHideSpeciesfilterMenu));
	}
	else {
		$("#bot_filtrar_especie").removeClass("active");
		$("#bot_filtrar_especie").attr("title", getLiteral(dict.ttAddSpeciesfilter));
	}
	// reactivo el tooltip
	if (Sesion.hayTooltips) {
		$("#bot_filtrar_especie").tooltip('dispose');
		$("#bot_filtrar_especie").tooltip();
	}
	
	// render de la selección de especies
	renderSeleccionEspecies(activar);
}


function renderSeleccionEspecies(activar) {
	// BÚSQUEDA CON ENTRADA DE TEXTO Y SUGERENCIAS DE ESPECIES
	var hespinfo = {};
	hespinfo.activar = activar;
	// rendering del subheading
	content = Mustache.render(especiesSubheadingTemplate, hespinfo);
	$("#especies_subheading").html(content);
	// handler de buscar especie...
	$("#in_especie").on("keyup search", function(e) {
		// trato las teclas de arriba, abajo y enter			
		if (e.which == 13) { // tecla ENTER
			// actúo según el focus
			if (Sesion.espfocus == -1)	{ // ninguna sugerencia seleccionada
				// si hay al menos una sugerencia (y habilitada) voy a la primera
				if ($("#sugeesps").children(":enabled").length > 0)
					$("#sugeesps").children(":enabled").eq(0).click();
			}
			else // obtengo la sugerencia y vamos a ella
				$("#sugeesps").children().eq(Sesion.espfocus).click();
		}
		else if (e.which == 40) { // tecla ABAJO
			// incremento focus
			Sesion.espfocus++;
			ajustarEspfocus();
		}
		else if (e.which == 38) { // tecla ARRIBA
			// decremento focus
			Sesion.espfocus--;
			ajustarEspfocus();
		}
		else { // caso normal
			var entrada = $(this).val();		
			// analizo la cadena de entrada
			if (entrada.length == 0) { // está vacía: muestro la taxonomía y elimino las sugerencias
				$("#especies_block").removeClass("d-none");
				$("#sugeesps").html("");
			}
			else {	// hay algo: muestro sugerencias y escondo la taxonomía
				$("#especies_block").addClass("d-none");
				// obtengo sugerencias de especies
				var suges = sugeEspecies(entrada);
				// renderizo las sugerencias
				renderSugeEspecies(entrada, suges);							
			}
		}
	});
	
	// NAVEGACIÓN ONTOLOGÍA DE ESPECIES
	if (activar) { // mostrar el bloque de contenido de las especies
		$("#especies_block").removeClass("d-none");
		// ¿caso inicial?
		if ($("#especies_block").html() == "") {	
			// preparo datos para mostrar
			var bespinfo = [];
		
			// analizo las especies top
			_.each(config.especiesTop, function(spuri) {
				// obtengo información del objeto para formatear
				var spinfo = getInfoSpecies(spuri);
				// incluyo también el indent
				spinfo.indent = 0;
				spinfo.indentspace = '';				
				// añado el objeto SÓLO SI TIENE INDIVIDUOS
				if (spinfo.allindivs > 0)
					bespinfo.push(spinfo);
			});
		
			// sort elements
			bespinfo = _.sortBy(bespinfo, 'label').reverse();
			bespinfo = _.sortBy(bespinfo, function(el) { return (+el.nclasses*100 + +el.allindivs); });
			bespinfo =	bespinfo.reverse();
		
			// generate the mark-up
			var content = Mustache.render(especiesBlockTemplate, bespinfo);

			// pongo el contenido
			$("#especies_block").html(content);
			
			// pongo tooltips
			if (Sesion.hayTooltips)
				$("#especies_block").find('[data-toggle="tooltip"]').tooltip();

			// HANDLERS
			// handler de seleccionar especie para filtrar
			$(".bot_especie_filt").click(handlerSeleccionarEspecie);			
			// handler de expandir especie
			$(".bot_expandir_especie").click(handlerExpandSpecies);
		}
		else // simplemente mostrar lo que tenía
			$("#especies_block").removeClass("d-none");
	}
	else // esconder el bloque de contenido de las especies
		$("#especies_block").addClass("d-none");
}


function renderSugeEspecies(entrada, sugerencias) {
	// preparo sugerencias
	var sinfo = {};
	sinfo.sugerencias = [];
		
	// obtengo las sugerencias si la entrada no está vacía
	if (sugerencias.length == 0)
		sinfo.nosugerencias = true;
	else {
		_.each(sugerencias, function(suge) {
			// obtengo información del objeto para formatear
			var spinfo = getInfoSpecies(suge);
			// índice en el que hubo match
			var ind = indexOfNormalized(spinfo.label, entrada);
			// formateo el nombre a mostrar con negritas
			spinfo.labelshown = "";
			if (ind > 0)
				spinfo.labelshown += spinfo.label.substr(0, ind);
			spinfo.labelshown += "<strong>" + spinfo.label.substr(ind, entrada.length) + "</strong>"
			spinfo.labelshown += spinfo.label.substr(ind + entrada.length);			
			// añado el objeto SÓLO SI TIENE INDIVIDUOS
			if (spinfo.allindivs > 0)
				sinfo.sugerencias.push(spinfo);
		});
	}
	// corto número de sugerencias
	sinfo.sugerencias = sinfo.sugerencias.slice(0, config.numespsugs);
	
	// ordeno sugerencias por número de individuos y subclases
	sinfo.sugerencias = _.sortBy(sinfo.sugerencias, function(el) { return (+el.nclasses*100 + +el.allindivs); });
	sinfo.sugerencias =	sinfo.sugerencias.reverse();
	
	// muestro sugerencias
	var cont = Mustache.render(sugeEspsTemplate, sinfo);
	$("#sugeesps").html(cont);
	
	// tooltips sugerencias
	if (Sesion.hayTooltips)
		$("#sugeesps").find('[data-toggle="tooltip"]').tooltip();
		
	// handler de los botones de sugerencias
	$(".bot_suge_especie").click(handlerSeleccionarEspecie);
	
	// inicializo focus
	Sesion.espfocus = -1;
}
function ajustarEspfocus() {
	// Sesion.espfocus = 0; => cajetín entrada
	// Sesion.espfocus = i; => num de sugerencia
	// obtengo número de sugerencias que no están deshabilitadas
	var ns = $("#sugeesps").children(":enabled").length;
	//if (ns == 1 && $("#sugeesps").children().eq(0)  )// corrección por si no es una sugerencia real
	// reajusto índice del focus si hace falta
	if (ns == 0) Sesion.espfocus = -1;
	else if (Sesion.espfocus >= ns) Sesion.espfocus = 0;
	else if (Sesion.espfocus < 0) Sesion.espfocus = ns -1;
	// y ahora las cosas visuales
	$("#sugeesps").children().removeClass("active");
	if (Sesion.espfocus >= 0)
		$("#sugeesps").children().eq(Sesion.espfocus).addClass("active");
}
function sugeEspecies(entrada) {
	var sugerencias = [];
	// sólo actúo si la entrada no es una cadena vacía
	if (entrada.length > 0) {
		// obtengo las uris de las especies ordenadas alfabéticamente
		var espuris = _.keys(Datinv.especies).sort();
		// evalúo cada especie si vale
		for (var i=0; i<espuris.length; i++) {
			// obtengo etiqueta de la especie (por defecto nombre vulgar)
			var labesp = getLiteral(Datinv.especies[espuris[i]][onturis.prVulgarName].lits, uriToLiteral(espuris[i]));
			// si hay nombre científico...		
			if (Sesion.nomci) {
				labesp = firstUppercase(getLiteral(Datinv.especies[espuris[i]][onturis.prScientificName].lits,
					labesp));
			}
			// si coincide, a las sugerencias
			if (indexOfNormalized(labesp, entrada) > -1)
				sugerencias.push(espuris[i]);
		}
	}
	return sugerencias;
}


function handlerExpandSpecies() {
	// obtengo i para el icono
	var $i = $(this).find("i");
	var $div = $(this).closest(".especie");
	
	if ($(this).hasClass("active")) { // colapsar
		// desactivo botón
		$(this).removeClass("active");
		// pongo otro icono
		$i.removeClass("fa-chevron-down");
		$i.addClass("fa-chevron-right");
		// cambio tooltip
		if (Sesion.hayTooltips) {
			$(this).tooltip('dispose');
			$(this).attr("title", getLiteral(dict.ttExpandSpecies));
			$(this).tooltip();
		}
		
		// itero para quitar los elementos de la lista
		var indent = +$div.attr("indent");
		do {
			var $nextdiv = $div.next();
			var fin = true;
			if (+$nextdiv.attr("indent") > indent) {
				$nextdiv.remove();
				fin = false;
			}				
		} while (!fin);
	}
	else { // expandir
		// activo botón
		$(this).addClass("active");
		// pongo otro icono
		$i.removeClass("fa-chevron-right");
		$i.addClass("fa-chevron-down");
		// cambio tooltip
		if (Sesion.hayTooltips) {
			$(this).tooltip('dispose');
			$(this).attr("title", getLiteral(dict.ttCollapseSpecies));
			$(this).tooltip();
		}
		
		// get uri of the class and prepare indentspace
		var spuri = $div.find(".bot_especie_filt").attr("spuri");
		var newindent = +$div.attr("indent") + 1;
		var indentspace = "";
		for (var ind = 0; ind < newindent; ind++) 
			indentspace += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		
		// generate aux object for the template
		var scobj = [];
		_.each(Datinv.especies[spuri].subclasses, function(subspuri) {
			// obtengo información del objeto para formatear
			var subspinfo = getInfoSpecies(subspuri);
			// incluyo también el indent
			subspinfo.indent = newindent;
			subspinfo.indentspace = indentspace;				
			// añado el objeto SÓLO SI TIENE INDIVIDUOS
			if (subspinfo.allindivs > 0)
				scobj.push(subspinfo);
		});
		
		// sort elements
		scobj = _.sortBy(scobj, 'label').reverse();
		scobj = _.sortBy(scobj, function(el) { return (+el.nclasses*100 + +el.allindivs); });
		scobj =	scobj.reverse();
		
		// show more button
		if (scobj.length > config.hidemax) {
			// include fake element for the button
			scobj.splice(config.hidebegin, 0, { "botonesconder" : true, "indent" : newindent, "indentspace" : indentspace+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" });
			for (var ind = config.hidebegin + 1; ind < scobj.length; ind++)
				scobj[ind].esconder = true;						
		}						

		// generate content and add	to the DOM
		var newcontent = Mustache.render(especiesBlockTemplate, scobj);							
		$div.after(newcontent);
		
		// pongo tooltips
		if (Sesion.hayTooltips)
			$("#especies_block").find('[data-toggle="tooltip"]').tooltip();
		
		// handler de seleccionar especie para filtrar
		$(".bot_especie_filt").off('click');
		$(".bot_especie_filt").click(handlerSeleccionarEspecie);
		
		// recreate handlers of the expand/collapse buttons
		$(".bot_expandir_especie").off('click');
		$(".bot_expandir_especie").click(handlerExpandSpecies);
		
		// recreate handlers of the showmore buttons
		$(".showmore").off('click');
		$(".showmore").click(handlerShowmore);
	}
}


function handlerShowmore() {
	var $div = $(this).closest(".especie");
	var indent = +$div.attr("indent");
	// show elements
	var $aux = $div;
	do {
		var $aux = $aux.next();
		var fin = true;
		if (+$aux.attr("indent") == indent && $aux.hasClass("d-none")) {
			$aux.removeClass("d-none");
			$aux.addClass("d-flex");			
			fin = false;
		}				
	} while (!fin);	
	// remove show more button
	$div.remove();
}

function renderFiltrosEspecies() {
	// preparo array con especies filtradas
	var espfilts = [];
	_.each(Sesion.espfilturis, function(spuri, ind) {
		var spobj = {};
		// índice
		spobj.ind = ind;
		// etiqueta
		spobj.label = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prVulgarName].lits, 
			uriToLiteral(spuri)));
		// si hay nombre científico...
		if (Sesion.nomci) {
			spobj.label = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prScientificName].lits,
				spobj.label));
		}
		// nombre científico
		spobj.nomci = Sesion.nomci;
		// color
		spobj.color = config.colplots[Sesion.espfiltcolinds[ind]][1];
		// incluyo colores posibles
		spobj.colores = [];
		var colsactivos = Sesion.espfiltcolinds.slice(0, Sesion.espfilturis.length);
		var colsno = _.without(colsactivos, Sesion.espfiltcolinds[ind]);
		var cols = _.difference(config.colespinds, colsno);
		_.each(cols, function(cind) {
			spobj.colores.push({"cind": cind, "label": getLiteral(dict["color"+cind])});
		});	
		// si el endpoint de DBpedia activo y hay uri de DBpedia...
		if (Sesion.dbpediaDisp && Datinv.especies[spuri][onturis.prSameAs] != undefined 
				&& Datinv.especies[spuri][onturis.prSameAs].ovals != undefined ) {
			// incluyo uri del recurso en la dbpedia
			_.each(Datinv.especies[spuri][onturis.prSameAs].ovals, function(sameasuri) {
				if (sameasuri.includes("dbpedia"))
					spobj.dbr = sameasuri;		
			});	
			// incluri uri de la especie
			spobj.spuri = spuri;
		}
		// incluyo objeto
		espfilts.push(spobj);
	});	
	
	// rendering de las especies filtradas
	var content = Mustache.render(filtroEspeciesTemplate, espfilts);	
	$("#filtros_especies").html(content);
	// pongo tooltips
	if (Sesion.hayTooltips)
		$("#filtros_especies").find('[data-toggle="tooltip"]').tooltip();
	
	// HANDLERS	
	// handler para quitar la especie seleccionada
	$(".bot_quitar_especie_filt").click(function() {
		// quito tooltip
		if (Sesion.hayTooltips)
			$(this).children().tooltip('dispose');	
		// cojo el índice
		var ind = Number($(this).attr("ind"));
		
		// mando evento a GA
		sendEvent('species', 'species_unselection', Sesion.espfilturis[ind]);
		
		// borro la especie
		Sesion.espfilturis.splice(ind, 1);
		//Sesion.espfilturisexp.splice(ind, 1);
		// guardo color que tenía y lo meto al final
		var col = Sesion.espfiltcolinds[ind];
		Sesion.espfiltcolinds.splice(ind, 1);
		Sesion.espfiltcolinds.push(col);
		
		// renderizo de nuevo las especies tras un delay 
		// para que no se tueste al repintar
		// ya que nos cargamos lo que había antes al hacer el render
		setTimeout(function(){
			renderFiltrosEspecies();
		}, 50);
		
		// actualizo el mapa como si lo hubiera movido
		mapaMovido();
	});		
	// handler del dropdown de color para quitar el tooltip
	if (Sesion.hayTooltips) {
		$(".bot_color_filtro").click(function() {
			// voy al padre y escondo el tooltip
			$(this).parent().tooltip('hide');
		});	
	}	
	// handler del color de la especie
	$(".dropdown_color_especie").click(function() {
		// cojo el índice
		var ind = Number($(this).attr("ind"));
		// cojo el índice del color
		var cind = Number($(this).attr("cind"));
				
		// mando evento a GA
		sendEvent('species', 'species_color_change', Sesion.espfilturis[ind], cind);
		
		// actualizo color
		Sesion.espfiltcolinds[ind] = cind;
		// puede que tenga que quitar algún color de espfiltcolinds...
		var indborrar = null;
		for (var otrind = ind+1; otrind < Sesion.espfiltcolinds.length; otrind++) {
			if (Sesion.espfiltcolinds[otrind] != undefined && Sesion.espfiltcolinds[otrind] == cind)
				indborrar = otrind;
		}
		if (indborrar != null)
			Sesion.espfiltcolinds.splice(indborrar, 1);
		
		// actúo en modo parcela para cambiar los colores
		if (Sesion.modo === 'PARC') {		
			// actualizo color, pero tooltips no
			var puris = _.keys(Sesion.parcsPintadas);
			ajustarColorTooltipsParcelas(puris, false);
		}
		else if (Sesion.modo === 'ARB') {		
			// actualizo iconos de los árboles pintados
			var arburis = _.keys(Sesion.arbsPintados);
			_.each(arburis, function(arburi) {
				// recupero el árbol
				var arb = Datinv.arboles[arburi];
				// obtengo su icono
				var ticon = getIconoArbol(arb);
				// cambio el icono si no coincide
				if (Sesion.arbsPintados[arburi].getIcon() != ticon)
					Sesion.arbsPintados[arburi].setIcon(ticon);
			});			
		}
		
		// si estoy en modo provincia cambio los colores de las provincias
		if (Sesion.modo === 'PROV')
			ajustarColorTooltipsProvincias();
		else { // en otro caso, ajusto colores teselas de monte
			var turis = _.keys(Sesion.tessPintadas);
			ajustarColorTeselas(turis, false);
		}
		
		// quito todos los tooltips para que on se queden huérfanos al cargarnos el bloque
		if (Sesion.hayTooltips)
			$("#filtros_especies").find('[data-toggle="tooltip"]').tooltip('dispose');
				
		// renderizo de nuevo las especies tras un delay 
		// para que no se tueste al repintar
		// ya que nos cargamos lo que había antes al hacer el render
		setTimeout(function(){
			renderFiltrosEspecies();
		}, 50);
	});
	// handler del popover especie
	$(".bot_popover_especie").click(function() {
		// guardo botón del click para referenciarlo luego
		var $boton = $(this);
	
		// quito el tooltip primero
		if (Sesion.hayTooltips)
			$boton.tooltip('dispose');
			
		// obtengo uris de la especie y del recurso en dbpedia
		var spuri = $boton.attr("spuri");
		var dbr = $boton.attr("dbr");
		//console.log(spuri + " - " + dbr);
		
		// mando evento a GA
		sendEvent('species', 'species_show_info', spuri);
		
		// objeto especie
		var spobj = Datinv.especies[spuri];
		
		// ¿está cacheado el objeto del popover de la especie?
		if (spobj.popobj == undefined) {
			// inicializo el objeto dbr
			if (spobj[dbr] == undefined)
				spobj[dbr] = {};
			// compruebo si la uri que tengo de la dbpedia tiene redirect a algo
			getPropsResources(DBpediaProv, [dbr], [onturis.prWikiredirect], 
					spobj, function() {
				if (spobj[dbr][onturis.prWikiredirect].ovals != undefined) {
					// hay un redirect, redefino dbr con el redirect
					dbr = spobj[dbr][onturis.prWikiredirect].ovals[0];// inicializo el objeto dbr
					if (spobj[dbr] == undefined)
						spobj[dbr] = {};
				}
				// a consultar a la DBpedia por imagen y comment
				// guardo los resultados en el objeto de la especie
				getPropsResources(DBpediaProv, [dbr], [onturis.prComment, onturis.prThumbnail], 
						spobj, function() {
					// todo listo para preparar el objeto del popover
					spobj.popobj = {};
					// nombre científico
					var label = firstUppercase(getLiteral(spobj[onturis.prVulgarName].lits, 
						uriToLiteral(spuri)));
					spobj.popobj.nomci = firstUppercase(getLiteral(spobj[onturis.prScientificName].lits,
						label));
					// imagen
					if (spobj[dbr][onturis.prThumbnail].ovals != undefined)
						spobj.popobj.imagen = spobj[dbr][onturis.prThumbnail].ovals[0];
					// resumen
					if (spobj[dbr][onturis.prComment].lits != undefined)
						spobj.popobj.resumen = getLiteral(spobj[dbr][onturis.prComment].lits);
					// wikipage
					if (spobj[onturis.prWikipediaPage].lits != undefined)
						spobj.popobj.wikipage = getLiteral(spobj[onturis.prWikipediaPage].lits);
					// indico tipo: especie, género, familia o clase
					if (spobj.nivel == 0)
						spobj.popobj.tipo = getLiteral(dict.species);
					else if (spobj.nivel == 1)
						spobj.popobj.tipo = getLiteral(dict.genus);
					else if (spobj.nivel == 2)
						spobj.popobj.tipo = getLiteral(dict.family);
					else if (spobj.nivel == 3)
						spobj.popobj.tipo = getLiteral(dict.class);
					// simulo un click para que entre de nuevo y ahora lo pinte
					$boton.click();
				});
			});
		}
		else {
			// a generar el popover a partir del popobj
			var htmlpopover;
			var maxwidth;
			// generación dependiente del tamaño
			if ($(window).width() > 800) {
				maxwidth = "600px";
				htmlpopover = Mustache.render(speciesPopoverTemplate, spobj.popobj);
			}
			else {
				maxwidth = "350px";
				htmlpopover = Mustache.render(speciesPopoverSmallWidthTemplate, spobj.popobj);
			}		
			// mostramos popover
			$(this).popover( {
					container: 'body',
					placement: 'right',
					trigger: 'focus',
					template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-body"></div></div>',
					html: true,
					content: htmlpopover} )
				// ajuste para ancho
				.on("show.bs.popover", function(){ $($(this).data("bs.popover").getTipElement()).css("max-width", maxwidth); })
				// ajuste para recuperar tooltip
				.on("hide.bs.popover", function(){ if (Sesion.hayTooltips) $(this).tooltip(); })
				.popover('show');
			// esta guarrada de abajo es porque no funciona el dismiss en el Firefox Mobile
			$("#dbpedia-card").click(function() {
				$boton.popover('hide');
			});	
		}
	});		
}


function handlerSeleccionarEspecie() {
	// obtengo uri de la especie
	var spuri = $(this).attr("spuri");
	// compruebo si la tenía
	var inters = _.intersection(Sesion.espfilturis, [spuri]);
	if (inters.length == 0) { // no estaba
		// si supero el número de especies filtradas no permito filtrar más
		if (Sesion.espfilturis.length >= config.maxspfilters) {
			// aviso con un toast de que hay muchas especies...
			$('.toast').removeClass("d-none");
			$('.toast').toast('show');
		}
		else { // a guardar	
			// guardo uri de la especie
			Sesion.espfilturis.push(spuri);
			
			// mando evento a GA
			sendEvent('species', 'species_selection', spuri);
		
			// elijo un color aleatoriamente entre los posibles si no hubiera color
			if (Sesion.espfiltcolinds.length < Sesion.espfilturis.length ) {
				var cols = _.difference(config.colespinds, Sesion.espfiltcolinds);
				var ind = Math.floor(Math.random() * cols.length);
				Sesion.espfiltcolinds.push(cols[ind]);
			}
		
			// renderizo los filtros de especies
			renderFiltrosEspecies();
		
			// actualizo el mapa como si lo hubiera movido
			mapaMovido();
		}
	}
	// si estaba no hago nada
}

// para formatear las especies
function getInfoSpecies(spuri) {
	// recupero especie
	var sp = Datinv.especies[spuri];
	// el objeto a devolver
	var spinfo = {};
	// incluyo la uri
	spinfo.uri = spuri;
	// por defecto nombre vulgar
	spinfo.label = firstUppercase(getLiteral(sp[onturis.prVulgarName].lits, 
		uriToLiteral(spuri)));
	// si hay nombre científico...		
	if (Sesion.nomci) {
		spinfo.nc = true;
		spinfo.label = firstUppercase(getLiteral(sp[onturis.prScientificName].lits,
			spinfo.label));
	}
	/* TODO no consigo que el popover se vaya a la derecha en el flex, así que no lo pongo de momento 
	// si el endpoint de DBpedia activo y hay uri de DBpedia...
	if (Sesion.dbpediaDisp && sp[onturis.prSameAs] != undefined && sp[onturis.prSameAs].ovals != undefined ) {
		_.each(sp[onturis.prSameAs].ovals, function(sameasuri) {
			if (sameasuri.includes("dbpedia"))
				spinfo.dbpedia = sameasuri;		
		});	
	}*/
	// info número de clases
	spinfo.nclasses = 0;
	_.each(Datinv.especies[spuri].subclasses, function(suburi) {
		if (Datinv.especies[suburi] != undefined && Datinv.especies[suburi].indivs.countALL > 0)
			spinfo.nclasses++;
	});
	if (spinfo.nclasses == 0)
		spinfo.nosubclasses = true;			
	// info individuos
	spinfo.allindivs = sp.indivs.countALL;
	if (spinfo.allindivs > 1000000)
		spinfo.nindivs = "+" + Math.floor(+spinfo.allindivs/1000000) + "M";
	else if (spinfo.allindivs > 1000)
		spinfo.nindivs = "+" + Math.floor(+spinfo.allindivs/1000) + "K";
	else
		spinfo.nindivs = spinfo.allindivs;
	// devuelvo el objeto
	return spinfo;
}