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

function handlerFiltrarUsos() {
	// obtengo nuevo estado del botón
	var activar = !$("#bot_filtrar_uso").hasClass("active");
		
	// mando evento a GA
	if (activar)
		sendEvent('controls', 'controls_button', 'filter_uses_expanded');
	else
		sendEvent('controls', 'controls_button', 'filter_uses_collapsed');
		
	// pongo el botón activo o no y cambio el título del tooltip
	if (activar) {
		$("#bot_filtrar_uso").addClass("active");
		$("#bot_filtrar_uso").attr("title", getLiteral(dict.ttHideUsefilterMenu));
	}
	else {
		$("#bot_filtrar_uso").removeClass("active");
		$("#bot_filtrar_uso").attr("title", getLiteral(dict.ttAddUsefilter));
	}
	
	// reactivo el tooltip
	if (Sesion.hayTooltips) {
		$("#bot_filtrar_uso").tooltip('dispose');
		$("#bot_filtrar_uso").tooltip();
	}
	
	// render de la selección de usos
	renderSeleccionUsos(activar);
}

function renderSeleccionUsos(activar) {	
	// checkboxes usos teselas de monte
	if (activar) { // mostrar el bloque de contenido de los usos
		$("#usos_block").removeClass("d-none");
		// ¿caso inicial?
		if ($("#usos_block").html() == "") {			
			// preparo datos para mostrar
			var usosinfo = [];		
			// analizo los usos de monte
			var usomonte = Datinv.usos[onturis.forestuse];
			_.each(usomonte.subclasses, function(uuri, ind) {
				// obtengo información del objeto para formatear
				var uinfo = {};
				uinfo.uri = uuri;
				uinfo.label = getLiteral(Datinv.usos[uuri].label);
				uinfo.ind = ind;
				// y preparo también los subusos
				uinfo.subusos = [];
				_.each(Datinv.usos[uuri].subclasses, function(subuuri, subind) {
					// formateo
					var subuinfo = {};
					subuinfo.uri = subuuri;
					subuinfo.label = getLiteral(Datinv.usos[subuuri].label);
					subuinfo.ind = ind.toString() + subind.toString();
					// meto dentro
					uinfo.subusos.push(subuinfo);
				});
				// meto dentro
				usosinfo.push(uinfo);
			});		
			// sort elements
			usosinfo = _.sortBy(usosinfo, 'uri');
			
			// generate the mark-up
			var content = Mustache.render(usosBlockTemplate, usosinfo);			
			//console.log(content);
			// pongo el contenido
			$("#usos_block").html(content);
			
			// HANDLERS
			// handler de cambio en un check
			$(".usoCheck").change(handlerCambioSeleccionUso);			
		}
		else // simplemente mostrar lo que tenía
			$("#usos_block").removeClass("d-none");
	}
	else // esconder el bloque de contenido de las especies
		$("#usos_block").addClass("d-none");
}

function handlerCambioSeleccionUso() {
	// checkbox cambiado	
	var $div = $(this).parent("div");	
	var activo = this.checked;
	
	// mando evento a GA
	var uuri = $(this).attr("uuri");
	if (activo)		
		sendEvent('uses', 'uses_selection', uuri);
	else
		sendEvent('uses', 'uses_unselection', uuri);

	//console.log("Llamada a uso " + uuri + " - activo: " + activo);
	
	// AJUSTE CHECKBOXES ANIDADOS
	// activo/desactivo los hijos 	
	$div.children("div").children("input").prop('checked', activo);	
	// si tiene padre, rehago su estado
	var $divpadre = $div.parent("div.form-check");
	if ($divpadre.length) { // hay padre...
		// número de hijos del padre
		var nhijos = $divpadre.children("div").length;
		// número de hijos activados del padre
		var nhijosact = $divpadre.children("div").children("input:checked").length;
		// actúo según las activaciones
		if (nhijos == nhijosact) {
			$divpadre.children("input").prop('checked', true);
			$divpadre.children("input").prop('indeterminate', false);
		}
		else if (nhijosact == 0) {
			$divpadre.children("input").prop('checked', false);
			$divpadre.children("input").prop('indeterminate', false);
		}
		else {	// valor indeterminado
			$divpadre.children("input").prop('checked', false);			
			$divpadre.children("input").prop('indeterminate', true);
		}
		//console.log("#hijos: " + nhijos + " - #hijos activos: " + nhijosact);
	}
	
	// SELECCIONES DE USO Y ETIQUETAS
	Sesion.usofilturis = []; // inicialización de las uris de los usos filtradas
	var usolabels = []; // inicialización para la presentación
	var $divspadres = $("#usos_block").children("div");
	// analizo cada divpadre
	$divspadres.each(function () {
    	var $inputpadre = $(this).children("input");
    	if ($inputpadre.prop('indeterminate')) {
    		// hay que analizar los divs hijos...
    		//console.log("Valor indeterminado " + uuripadre);
    		var $divshijos = $(this).children("div");
    		$divshijos.each(function () {
    			var $inputhijo = $(this).children("input");
    			if ($inputhijo.prop('checked')) {
					// incluyo al hijo
					var uurihijo = $inputhijo.attr("uuri");
					var labelhijo = $(this).children("label").text();
					Sesion.usofilturis.push(uurihijo);
					usolabels.push(labelhijo);
				}
    		});
    	}
    	else if ($inputpadre.prop('checked')) {
    		// incluyo al padre
	    	var uuripadre = $inputpadre.attr("uuri");
	    	var labelpadre = $(this).children("label").text();
    		Sesion.usofilturis.push(uuripadre);
    		usolabels.push(labelpadre);
    	}
	});
	
	// AJUSTE ETIQUETAS DE USOS
	var texto = "";
	if (usolabels.length == 1)
		texto = usolabels[0];
	else if (usolabels.length == 2)
		texto = usolabels[0] + "<br>" + usolabels[1];
	else if (usolabels.length == 3)
		texto = usolabels[0] + "<br>" + usolabels[1] + "<br>" + usolabels[2];
	else if (usolabels.length > 3)
		texto = usolabels[0] + "<br>" + usolabels[1] + "<br><i>" + getLiteral(dict.filtering)
			+ " " + (usolabels.length - 2) + " " + getLiteral(dict.moreuses) + "</i>";
	// incluyo el texto
	$("#info_filtros_uso").html(texto);
	
	// ACTUALIZACIÓN TESELAS PARA FILTRO DE USO
	// si NO estoy en modo provincia cambio los colores de las teselas (todas, no sólo monte)
	if (Sesion.modo !== 'PROV') {
		var turis = _.keys(Sesion.tessPintadas);
		ajustarColorTeselas(turis, true);
	}
}