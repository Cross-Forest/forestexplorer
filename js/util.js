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
	

// UTILES
function indexOfNormalized(cadgrande, cadpeq) {
	// normalizo cadenas según: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
	// adicionalmente las pongo en minúsculas para comparar
	var cgnorm = cadgrande.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	var cpnorm = cadpeq.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	return cgnorm.indexOf(cpnorm);
}

function getColor(valor, valormax, colores) {
	if (isNaN(valor))
		return colores[0];
	var ncols = colores.length;
	var delta = valormax / ncols;
	// valores fuera de rango
	if (valor <= 0)
		return colores[0];
	else if (valor >= valormax)
		return colores[ncols -1];
	// uso rangos
	for (var ind=0; ind < ncols; ind++) {
		// devuelvo color si está en el escalón adecuado
		if (valor >= ind*delta && valor < (ind+1)*delta)
			return colores[ind];	
	}
}

function getLiteral(litobj, def) {
	// si no está definido el objeto, valor por defecto
	if (litobj == undefined)
		return def;
	// obtain list of language tags of the literal
	var ltags = Object.keys(litobj);
	// obtain list of user's preferred languages
	var preflangs = window.navigator.languages || [window.navigator.language || window.navigator.userLanguage];
	// return string with the preferred language, if exists
	for (var ind = 0 ; ind < preflangs.length; ind++) {
		var ltag = preflangs[ind];
		if (litobj[ltag] != undefined) 
			return litobj[ltag];
		// no luck, but maybe there is a language variant that serves (check with substrings)
		var lang = ltag.substring(0, 2);
		var tag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  lang;});
		if (tag != undefined)
			return litobj[tag];			
	}
	// no preferred language, try with English
	var entag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  'en';}); 
	if (entag != undefined) 
		return litobj[entag];
	// en otro caso devuelvo la cadena sin etiqueta de idioma
	if (litobj[config.nolang] != undefined) 
		return litobj[config.nolang];
	// pruebo en latín...
	var latag = _.find(ltags, function(el) { return el !== config.nolang && el.substring(0, 2) ===  'la';}); 
	if (latag != undefined) 
		return litobj[latag];
	// por última opción devuelvo la cadena por defecto
	return def;
}

function uriToLiteral(uri) {
	// extraigo la última parte de la uri
	var lit = "";
	if (uri.split("#").length > 1)
		lit = uri.split("#")[uri.split("#").length -1];
	else {
		lit = uri.split("/")[uri.split("/").length -1];
		if (lit === "")
			lit = uri.split("/")[uri.split("/").length -2];
	}
	// sustituyo - y _ por espacio
	lit = lit.replace(/-/g, " "); 
	lit = lit.replace(/_/g, " ");
	return lit;
}

function firstUppercase(lit) {
	if (lit != undefined && lit.length > 0)
		return lit.charAt(0).toUpperCase() + lit.slice(1);
		//return lit.charAt(0).toUpperCase() + lit.slice(1).toLowerCase();
	else
		return lit;
}

function firstLowercase(lit) {
	if (lit != undefined && lit.length > 0)
		return lit.charAt(0).toLowerCase() + lit.slice(1);
	else
		return lit;
}

function getAllSubclasses(curi, target) {
	var curis = [];
	var ituris = [curi];
	while (ituris.length > 0) {
		// meto las uris de la iteración
		curis = _.union(curis, ituris);
		// preparo las uris de la iteración siguiente
		var nituris = [];
		_.each(ituris, function(evuri) {
			nituris = _.union(nituris, target[evuri].subclasses);
		});
		// reajusto ituris
		ituris = nituris;
	}
	// quito curi de la lista
	curis = _.without(curis, curi);
	return curis;
}