


var data;
var army = {
	name: 'testArmy',
	dataFile: '',
	idx: 0,
	udx: 0,		// for selections
	odx: 0,		// for flagging each unit type so they can be identified within the program
	objects: [],
	grandTotal: 0,
	textOn: false,
	calcPoints: 3000,
	diffPoints: 0,
	calcOn: false
};
var stats = [];
var references = [];

var debounceHover = null;

$(document).ready(function() {

	$('.divPopup').html('');
	$('.divPopup').hide();

	$('#gridView').unbind("click");
	$('#gridView').click(function () {
		$('#divContent').html('<div id="divSelections" class="divSelections"><div id="divSelectionsHeader"></div><div id="divSelectionsContent"></div></div><div id="divFormations" class="divFormations"><div id="divFormationsHeader"></div><div id="divFormationsContent"></div></div>');
		drawSelection();
		drawFormations();
	});

	$('#plainText').unbind("click");
	$('#plainText').click(function () {
		$('#divContent').html('<div id="divPlainText" class="divPlainText"></div>');
		compilePlainText();
	});
	
	$('#statView').unbind("click");
	$('#statView').click(function () {
		$('#divContent').html('<div id="divStatView" class="divStatView"></div>');
		compileStatView(false);
	});

	$('#statViewMore').unbind("click");
	$('#statViewMore').click(function () {
		$('#divContent').html('<div id="divStatView" class="divStatView"></div>');
		compileStatView(true);
	});

	$('#dataExtract').unbind("click");
	$('#dataExtract').click(function () {
		$('#divContent').html('<div id="divDataExtract" class="divDataView"><textarea class="inputDataView" rows="40"></textarea><br>copy/paste this data into a file');
		compileDataExtract();
	});

	$('#dataLoad').unbind("click");
	$('#dataLoad').click(function () {
		$('#divContent').html('<div id="divDataLoad" class="divDataView"><textarea class="inputDataView" rows="40"></textarea><input type="button" class="buttonLoad" value="click to load"/>');

		$('.buttonLoad').unbind("click");
		$('.buttonLoad').click(function () {
			compileDataLoad();
		});
	});


	let baseUrl = new String(window.location).split('?')[0];
	let armyUrl = '';
	var paramString = new String(window.location).split('?')[1];
	$.each(paramString.split('&'), function() {
		let param = this;
		if(param.split('=')[0] == 'list')
		{ armyUrl = param.split('=')[1]; }
	});

	army.dataFile = armyUrl;
	var listFile = './armyList/' + armyUrl + '.json';
	loadFile('main', listFile);
});


function loadFile(mode, fileName){
	console.log(fileName);
	$.ajax({
		url: fileName,
		crossDomain: true,
		mimeType: "application/json"
	}).done(function(response) {
		switch(mode){
			case 'main':
				data = response;
				initSelections();
				$('#gridView').click();

				loadFile('army', data.includeFiles.primary);
				$.each(data.includeFiles.allies, function(){
					let thisAllies = this;
					loadFile('allies', thisAllies);
				});
				$.each(data.includeFiles.common, function(){
					let thisCommon = this;
					loadFile('reference', thisCommon);
				});
				break;
			case 'army':
				stats.push(response);
				break;
			case 'allies':
				stats.push(response);
				break;
			case 'reference':
				references.push(response);
				break;
		}
	}).fail(function(data){
		console.log('failure');
		console.log(data)
	});
}

function compileDataExtract(){
	// strips out the class object and replaces it with the class name... saves space
	let dup = JSON.parse(JSON.stringify(army));
	$.each(dup.objects, function(){
		let obj = this;
		obj.class = obj.class.name;
	});
	$('.inputDataView')[0].value = JSON.stringify(dup);
}

function compileDataLoad(){

	// restore the 'class' objects into the data
	dup = JSON.parse($('.inputDataView')[0].value);
	
	if( dup.dataFile == army.dataFile ){
		$.each(dup.objects, function(){
			let obj = this;
			console.log(obj);
			let formClass = findFormation(obj.class);
			console.log(formClass);
			obj.class = formClass;
		});
		
		army = dup;
		$('#gridView').click();
	} else {
		alert("The data provided does not match the current army list. Refer 'dataFile' field.");
	}
}

function compileStatView(showArmySpecialRules){

	let s = '';

	s += army.name + ', ' + army.grandTotal + ' POINTS';
	s += '<br>';
	s += data.faction + ' - ' + data.id + ' (' + data.version + ')';
	s += '<br>';
	s += '<br>';
	
	s += stats[0].armyStats.initiative;
	s += '<br>';
	s += stats[0].armyStats.strategy;
	s += '<br>';
	s += '<br>';

	s += 'FORMATIONS';
	s += '<br>';
	s += '==================================================';
	s += '<br>';
	s += '<br>';

	$.each(army.objects, function(){
		let formation = this;
		let uniqueItems = [];

		s += '<b>' + formation.class.name.toUpperCase() + '</b> [' + formation.formationTotal + ']';
		s += '<br>';


		let distinctUnits = formation.selection.map(item => item.unitId).filter((value, index, self) => self.indexOf(value) === index);
		$.each(distinctUnits, function(){
			let unitId = this;
			
			let selections = formation.selection.filter(function(s){
				return s.unitId == unitId;
			});
			let selection = selections[0];

			if( uniqueItems.indexOf(selection.type.toString()) == -1){
				uniqueItems.push(selection.type.toString());
			}

			if(selection.transport){
				let distinctTransports = selection.transport.map(item => item.type).filter((value, index, self) => self.indexOf(value) === index);
				$.each(distinctTransports, function(){
					let transportId = this;

					if( uniqueItems.indexOf(transportId.toString()) == -1){
						uniqueItems.push(transportId.toString());
					}
				});
			}
		});


		let firstItem = true;
		$.each(distinctUnits, function(){
			let unitId = this;

			let u = '';
			let q = 0;
			let t = '';
			

			$.each(formation.selection, function(){
				let selection = this;
				
				if( selection.unitId == unitId ){
					u = selection.type;
					q += selection.quantity;

					if(selection.transport){
						$.each(selection.transport, function(){
							let transport = this;
							t +=  ' + ' + transport.quantity + ' ' + transport.type;
						});
					}
				}
			});

			if( firstItem ){
				firstItem = false;
			} else {
				s += ', ';
			}
			
			s += q + ' ' + u + t;
		});
		
		s += '<table class="tableStats">';
		s += drawRowHeaders();
		$.each(uniqueItems, function(){
			let uItem = this;
			s += drawRow(uItem);
		});
		s += '</table>';

		s += '<br>';
		s += '<br>';
	});
	s += '<br>';


	if(showArmySpecialRules) {
		s += 'SPECIAL RULES';
		s += '<br>';
		s += '==================================================';
		s += '<br>';
		s += '<br>';

		$.each(data.specialRules, function(){
			let specialRule = this;

			let thisRule = stats[0].specialRules.filter(function(sp){
				return sp.title == specialRule.title;
			})[0];

			s += '<b>' + thisRule.title + '</b>';
			s += '<br>';
			$.each(thisRule.description, function(){
				let desc = this;
				s += desc;
				s += '<br>';
			});
			s += '<br>';
		});
	}
	

	$('#divStatView').html(s);
};

function drawRowHeaders(){
	let sx = '';
	sx += '<tr>';
	sx += '<th class="col250">name</th>';
	sx += '<th class="col60">type</th>';
	sx += '<th class="col100">speed</th>';
	sx += '<th class="col100">armour</th>';
	sx += '<th class="col60">cc</th>';
	sx += '<th class="col60">ff</th>';
	sx += '<th class="col250">weapon</th>';
	sx += '<th class="col100">range</th>';
	sx += '<th class="col150">firepower</th>';
	sx += '<th class="col150">wpn specRules</th>';
	sx += '<th class="col250">specialRules</th>';
	sx += '</tr>';
	return sx;
}

function findUnit(thisName){
	var thisUnit = null;
	
	// find the stats item
	$.each(stats, function(){
		let statSet = this;
		let sFilter = statSet.units.filter(function(su){
			return su.name == thisName;
		});
		if( sFilter.length == 1 ){
			thisUnit = sFilter[0];
		}
	});
	return thisUnit;
}

function findWeapon(thisName){
	var findWeapon = null;
	
	// find the stats item
	$.each(references, function(){
		let refSet = this;
		let sFilter = refSet.weapons.filter(function(su){
			return su.name == thisName;
		});
		if( sFilter.length == 1 ){
			findWeapon = sFilter[0];
		}
	});
	return findWeapon;
}

function drawRow(thisName){
	let sx = '';

	let statUnit = findUnit(thisName);
	if(statUnit){

		sx += '<tr>';
		sx += '<td>' + statUnit.name + '</td>';
		sx += '<td class="colCenter">' + statUnit.type + '</td>';
		sx += '<td class="colCenter">' + (statUnit.speed ? statUnit.speed : '-') + '</td>';

		sx += '<td class="colCenter">' + (statUnit.armour ? statUnit.armour : '-' ) + '</td>';
		sx += '<td class="colCenter">' + (statUnit.cc ? statUnit.cc : '-' ) + '</td>';
		sx += '<td class="colCenter">' + (statUnit.ff ? statUnit.ff : '-' ) + '</td>';
		
		if(statUnit.weapons){
			
			let sl = '<table class="tableWpns">';

			$.each(statUnit.weapons, function(){
				sl += '<tr>';

				let weapons = '';
				let ranges = '';
				let firepowers = '';
				let specRules = '';
				
				let weapon = this;
				let weaponCount = 1;
				
				if( weapon.indexOf('|') != -1){
					weaponCount = weapon.split('|')[0];
					weapon = weapon.split('|')[1];
				}
				
				let we = findWeapon( weapon);
				if(we){
					let wpnThis = (weaponCount.toString().indexOf('-') != -1 ? weaponCount + ' ' : (weaponCount > 1 ? weaponCount + 'x ' : '')) + we.name;
					weapons = weapons == '' ? wpnThis : weapons + '<br>' + wpnThis;
					
					$.each(we.modes, function(){
						let mode = this;

						if(mode.join){
							ranges = ranges == '' ? '' : ranges + '<br>' + '';
							firepowers = firepowers == '' ? mode.join : firepowers + '<br>' + mode.join;
							specRules = specRules == '' ? '' : specRules + '<br>' + '';
						} else {
							if( mode.range){
								ranges = ranges == '' ? mode.range : ranges + '<br>' + mode.range;
								firepowers = firepowers == '' ? mode.firepower : firepowers + '<br>' + mode.firepower;
							} else {
								ranges = ranges == '' ? '-' : ranges + '<br>' + '-';
								firepowers = firepowers == '' ? '(' + mode.firepower + ')': firepowers + '<br>(' + mode.firepower + ')';
							}
						
							if( mode.specialRules ){
								specRules = specRules == '' ? mode.specialRules : specRules + '<br>' + mode.specialRules;
							} else {
								specRules = specRules == '' ? '-' : specRules + '<br>' + '-';
							}
						}
					});
				}
				sl += '<td class="col250">' + weapons + '</td>';
				sl += '<td class="col100 colCenter">' + ranges + '</td>';
				sl += '<td class="col150">' + firepowers + '</td>';
				sl += '<td class="col150">' + specRules + '</td>';
				sl += '</tr>';
			});
			sl += '</table>';
			sx += '<td colspan=4>' + sl + '</td>'
		} else {
			sx += '<td colspan=4>' + '-' + '</td>';
		}

		if(statUnit.specialRules){
			sx += '<td>' + statUnit.specialRules + '</td>';
		} else {
			sx += '<td>-</td>';
		}
		sx += '</tr>';
	}
	
	return sx;
}

function compilePlainText(){

	let s = '';
	
	s += army.name + ', ' + army.grandTotal + ' POINTS';
	s += '<br>';
	s += data.faction + ' - ' + data.id + ' (' + data.version + ')';	
	
	s += '<br>';
	s += '==================================================';
	s += '<br>';
	s += '<br>';


	$.each(army.objects, function(){
		let formation = this;

		s += formation.class.name.toUpperCase()  + ' [' + formation.formationTotal + ']';
		s += '<br>';


		// hang on to this methodology, it's pretty sweet...
		let distinctArray = formation.selection.map(item => item.unitId).filter((value, index, self) => self.indexOf(value) === index);

		let firstItem = true;
		$.each(distinctArray, function(){
			let unitId = this;

			let u = '';
			let q = 0;
			let t = '';
			

			$.each(formation.selection, function(){
				let selection = this;
				
				if( selection.unitId == unitId ){
					u = selection.type;
					q += selection.quantity;

					if(selection.transport){
						$.each(selection.transport, function(){
							let transport = this;
							t +=  ' + ' + transport.quantity + ' ' + transport.type;
						});
					}
				}
			});

			if( firstItem ){
				firstItem = false;
			} else {
				s += ', ';
			}
			
			s += q + ' ' + u + t;
		});

		s += '<br>';
		s += '<br>';
	});

	$('#divPlainText').html(s);
}

function drawFormations(){

	$('#divFormationsHeader').html('<b>ARMY FORMATIONS</b><br><br><br>');

	let s = '';
	$('#divFormationsContent').html(s);

	$.each(data.sections, function(){
		let section = this;

		s += '<div class="divSection">';		
		s += '<div class="divSectionName">' + section.name + '</div>'
		if( section.notes ){
			s += '<div class="divSectionNotes">' + section.notes + '</div>'
		}

		$.each(section.formations, function(){
			let formation = this;

			let msg = checkConstraint_maxSelected(formation.name, false);
			let msg2 = checkConstraint_formationByPointsSelected(formation.name, false);

			let msgText = '';
			if(msg.length > 0){
				msgText += ' ' + msg[0].wtext;
			}
			if(msg2.length > 0){
				msgText += ' ' + msg2[0].wtext;
			}

			s += '<div class="divFormation' + ((msg.length > 0 || msg2.length > 0) ? ' divSelectionOff' : '') + '">';
			s += '	<div class="divFormationName">' + formation.name  + msgText + '</div>';
			s += '	<div class="divFormationPoints">' + formation.points + '</div>';
			s += '</div>';
		});
		s += '</div>';

	});
	$('#divFormationsContent').append(s);
	$('.divFormation:even').css("background-color", "#cccccc");

	$('.divFormation').not('.divSelectionOff').unbind("click");
	$('.divFormation').not('.divSelectionOff').click(function () {	

		let formationName = $(this).find(".divFormationName").html();
		addSelection(formationName, false);
	});
}	

function checkConstraint_maxSelected(checkFormation, exceeded){
	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'max'; }), function(){
		let constraint = this;
		$.each(constraint.from, function(){
			let formationName = this;
			let count = 0;

			if(checkFormation) {
				count += army.objects.filter(function(f){
					return f.class.name == formationName && f.class.name == checkFormation;
				}).length;
			} else {
				count += army.objects.filter(function(f){
					return f.class.name == formationName;
				}).length;
			}

			if( exceeded ){
				if(count > constraint.max){		// should not be possible, controlled by menu
					messages.push({
						"state": "exceeded",
						"wtext": "error: " + formationName
					});
				}
			} else {
				if(count == constraint.max){	//exceeded or reached -> check if max selection has been made for menus state
					messages.push({
						"state": "reached",
						"wtext": "[max " + count + ' ' + formationName + ']'
					});
				}
			}
		});
	});
	return messages;
}

function checkConstraint_maxPercentage(checkFormation, exceeded){
	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'percent'; }), function(){
		let constraint = this;
		let subTotal = 0;

		$.each(constraint.from, function(){
			let formationName = this;

			$.each(army.objects, function(){
				let checkFormation = this;
					
				if (this.class.name == formationName){
					subTotal += checkFormation.formationTotal
				}
			});
		});
			
		if( ( subTotal / army.grandTotal ) > (constraint.maxPercent / 100) ){
			messages.push({
				"state": "exceeded",
				"wtext": "WARNING : " + 'Percentage exceeded : ' + constraint.name + ' : Max ' + constraint.maxPercent + '%, Current ' + (Number(( subTotal / army.grandTotal ) * 100)).toFixed(0) + '%'
			});
		}
	});
	return messages;
}

function checkConstraint_formationRatio(checkFormation, exceeded){
	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'ratio'; }), function(){
		let constraint = this;
		let countForEach = 0;
		$.each(constraint.forEach, function(){
			let formationName = this;

			countForEach += army.objects.filter(function(f){
				return f.class.name == formationName;
			}).length;
		});

		let countFrom = 0;
		$.each(constraint.from, function(){
			let formationName = this;

			countFrom += army.objects.filter(function(f){
				return f.class.name == formationName;
			}).length;
		});

		if( countForEach / countFrom  < 1/ constraint.max ){
			messages.push({
				"state": "exceeded",
				"wtext": "WARNING : " + 'Ratio exceeded : ' + constraint.name + ' : Max 1:' + constraint.max + ' '
			});
		}
	});
	return messages;
}

function checkConstraint_formationRatioLimit(checkFormation, exceeded){
	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'ratioLimit'; }), function(){
		let constraint = this;
		let countForEach = 0;
		$.each(constraint.forEach, function(){
			let formationName = this;

			countForEach += army.objects.filter(function(f){
				return f.class.name == formationName;
			}).length;
		});

		$.each(constraint.from, function(){
			let formationName = this;

			let countFrom = army.objects.filter(function(f){
				return f.class.name == formationName;
			}).length;
			
			if( countFrom > (countForEach * constraint.max)){
				messages.push({
					"state": "exceeded",
					"wtext": "WARNING : " + 'Ratio Limit exceeded : ' + constraint.max + ' of each Secondary type per Primary.'
				});
			}
		});
	});
	return messages;
}

function checkConstraint_mandatoryUnit(checkFormation, exceeded){
	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'mandatoryUnit'; }), function(){
		let constraint = this;
		
		let count = 0;
		let formationList = '';
		let firstList = true;
		
		$.each(army.objects, function(){
			let formation = this;

			$.each(constraint.from, function(){
				let checkFormation = this;
				if( firstList )
				{ formationList = formationList == '' ? checkFormation : formationList + ',' + checkFormation; }
			
				let checkFor = formation.selection.filter(function(f){
					return f.type == checkFormation;
				});

				count += checkFor.length;
			});
			firstList = false;
		});	

		if( count < constraint.min ){
			messages.push({
				"state": "exceeded",
				"wtext": "WARNING : " + 'Mandatory upgrade not included: ' + formationList
			});
		}
	});
	return messages;
}

function checkConstraint_upgradeMaxSelected(checkFormation, exceeded){
	
	let messages = [];
	$.each(data.upgradeConstraints.filter(function(c){ return c.type == 'max'; }), function(){
		let constraint = this;
		
		let count = 0;
		let showFormationName = '';
		
		$.each(army.objects, function(){
			let formation = this;

			$.each(constraint.from, function(){
				let formationName = this;
				
				count += formation.selection.filter(function(f){
					return f.type == formationName && f.type == checkFormation;
				}).length;

				if( count > 0 ){
					showFormationName = checkFormation;
				}
			});
		});	

		if( count == constraint.max ){
			messages.push({
				"state": "reached",
				"wtext": "[max " + count + ' ' + showFormationName + ']'
			});
		}
	});
	return messages;
}

function checkConstraint_formationByPointsSelected(checkFormation, exceeded){
//  o  constrains per points  1500pt dkok as an example
//     ok, so my interpretation of this is...
//	 for every block of 1500points or part thereof, you may include 1 of these formation, whose points contribute to that total.
//	 for 0-1500 points include 1 unit @ 200 pts (part of the 1500points.
//	 you may then add another 1 unit @ 200 points (new total 1700) which is the 'next 1500pts'.

	let messages = [];
	$.each(data.formationConstraints.filter(function(c){ return c.type == 'maxpoints'; }), function(){
		let constraint = this;

		let count = 0;
		let showFormationName = '';
		$.each(army.objects, function(){
			let formation = this;

			$.each(constraint.from, function(){
				let formationName = this;

				if( formation.class.name == formationName && formation.class.name == checkFormation ){
					count++;
					showFormationName = checkFormation;
				}
			});
		});

		if( count > 0){
			if( (constraint.value * count) - army.grandTotal > 0 ) {
						messages.push({
							"state": "reached",
							"wtext": "[maxpoints " + count + ' ' + showFormationName + ']'
						});
			}
		}
	});
	return messages;
}

function checkConstraint_upgradeMutualExclusion(checkFormation, checkUpgrade, exceed){

	// this works on a first come, first served basis, not override
	// so if the user has selected rhino, then drop pods become excluded (deactivated)
	// if drop pods are picked first, then rhinos become excluded...

	let messages = [];

	var exclude = false;
	var excludeOn = '';
	var conditions = checkFormation.class.conditions;
	
	$.each(checkFormation.selection, function(){
		let selection = this;

		$.each(conditions, function(){
			let condition = this;

			if(selection.type != checkUpgrade.type){
				if(	condition.what.indexOf(selection.type) != -1 &&
					condition.what.indexOf(checkUpgrade.type) != -1){
					exclude = true;
					excludeOn += selection.type + ' vs ' + checkUpgrade.type;
				}
			}
		});
		
		if(selection.transport){
			$.each(selection.transport, function(){
				let transport = this;
				$.each(conditions, function(){
					let condition = this;
					if( transport.type != checkUpgrade.type ){
						if(	condition.what.indexOf(transport.type) != -1 &&
							condition.what.indexOf(checkUpgrade.type) != -1){
							exclude = true;
							excludeOn = 'exclusion: ' + transport.type + ' vs ' + checkUpgrade.type;
						}
					}
				});
			});
		}
	});
	
	if( exclude){
		messages.push({
			"state": "exclude",
			"wtext": "[" + excludeOn + ']'
		});
	}
	return messages;
}

function checkConstraint_upgradeLimit(checkFormation, checkUpgrade, exceed){
	let messages = [];

	var count = 0;
	$.each(checkFormation.class.conditions.filter(function(f){ return f.type == 'limit';}), function(){
		let condition = this;
		
		$.each(checkFormation.selection, function(){
			let selection = this;

			if(selection.type == condition.from && selection.type == checkUpgrade.type){
				count++;
			}		
		});

		if( count >= condition.max){
			messages.push({
				"state": "reached",
				"wtext": "maximum selected"
			});
		}
	});	
	
	return messages;
}

function checkConstraint_upgradeRatio(checkFormation, exceeded){

	let messages = [];
	$.each(data.upgradeConstraints.filter(function(c){ return c.type == 'ratioupgrade'; }), function(){
		let constraint = this;
		let count = 0;
		
		if( constraint.forEach.indexOf(checkFormation.class.name) != -1 ){

			$.each(checkFormation.selection, function() {
				let sel = this;
				if( constraint.from.indexOf(sel.fromComponent.id) != -1 ){
					count++;
				}
			});
		}
		
		if( count >= constraint.max ){
			messages.push({
				"state": "reached",
				"wtext": "[max upgrades reached " + count + ']'
			});
		}
	});
	return messages;
}

function addSelection(formationName, isMandatory){

	let xClass = findFormation(formationName);

	let defaults = [];

	$.each(xClass.composition, function(){
		let component = this;
		let transObj = null;
		if( component.type == 'core') {
			if( component.min > 0 ){

				// add default transports if specified in the army chart
				if(component.transports){
					let defaultTransport = component.transports.filter(function(tt){
						return tt['default'];
					});
					if(defaultTransport.length > 0){
						transObj = {"type": defaultTransport[0].type, "quantity": (component.units[0].quantity * component.max) / defaultTransport[0].capacity }
					}
				}
				
				let newSel = {
						"id": army.udx,
						"type": component.units[0].type,
						"quantity": (component.units[0].quantity * component.min),
						"fromComponent": component,
						"unitId": component.units[0].id,
						"formationTotal": component.points
					};
				if( transObj ){
					newSel.transport = [];
					newSel.transport.push(transObj);
				}
				
				defaults.push(newSel);
				army.udx++;
			}
		}
	});
	
	army.objects.push(
		{
			"id": army.idx,
			"class": xClass,
			"selection": defaults,
			"isMandatory": isMandatory
		}
	);

	drawSelection();
	drawFormations();
	army.idx++;
}

function findFormation(name){
	let formationClass = null;
	$.each(data.sections, function(){
		let section = this;
		
		$.each(section.formations, function(){
			let formation = this;

			if( formation.name == name ){
				formationClass = formation;
			}
		});
	});			
	return formationClass;
}

function initSelections(){
	$.each(data.formationConstraints, function(){		
		let constraint = this;
		if( constraint.min > 0 && constraint.type == 'max'){
			$.each(constraint.from, function(){		
				let formationName = this;				
				for( var x = 0; x < constraint.min; x++) {
					addSelection(formationName, true);
				}
			});			
		}
	});
}

function drawSelection(){

	army.grandTotal = 0;
	army.diffPoints = 0;
	
	let ss = '';
	ss += '<div><div class="divSelectionsTitle"><b><div class="divArmyName">' + army.name + '</div></b></div><div class="divSelectionsPoints"></div></div>';
	ss += '<div><div class="divSelectionsTitle"><b><div class="divCalcPoints">build limit: ' + army.calcPoints + '</div></b></div><div class="divSelectionsDiffPoints"></div></div>';
	ss += '<div>' + data.faction + '</div>';
	ss += '<div>' + data.id + ' (' + data.version + ')</div>';
	ss += '<div class="divWarnings"></div>';

	$('#divSelectionsHeader').html(ss);

	$('.divWarnings').hide();
	

	if( army.length == 0 ){
		$('#divSelectionsContent').hide();
	} else {
		$('#divSelectionsContent').show();		
	}


	$('#divSelectionsContent').html('');


	$.each(army.objects, function(){
		let formation = this;
		let formationTotal = formation.class.points;

		//first draw the header for each selected formation
		let s = '';
		s += '<div id="divSelection_' + formation.id + '" class="divSelection">';
		s += '	<div class="divSelectionPrimary">';
		s += '		<div class="divSelectionTop">';
		s += '			<div class="divSelectionName">' + formation.class.name + '</div>';
		s += '			<div class="divSelectionPoints"></div>';
		s += '		</div>';
		s += '	</div>';
/*
		s += '	<div class="divSelectionButton">dd</div>';
		s += '	<div class="divSelectionButton">uu</div>';
		s += '	<div class="divSelectionButton">xx</div>';
*/
		//then draw the components (core or upgrade) that are included in the selected formation
		let ss = '';
		$.each(formation.class.composition, function(){
			let component = this;
			$.each(component.units, function(){
				let unitType = this;

				let selected = formation.selection.filter(function(f){
					return f.unitId == unitType.id;
				});

				if( selected.length > 0 ){
					let n = '';
					let q = 0;
					let a = 0;
					let iid = null;

					// /////////////////////
					// re transport elements
					let calcConsume = 0;
					let calcCapacity = 0;
				 	
					let tArray = [];
					$.each(selected, function(){
						let sel = this;
						
						iid = (iid == null ?sel.id : iid);		// always pick the 'first' occurrence if multiple, so all vehicles loaded onto that item
						n = sel.type;
						q += sel.quantity;

						if( sel.fromComponent.consume ){
							calcConsume += Number(sel.fromComponent.consume) * Number(sel.quantity);
						}

						if( sel.transport ){
							$.each(sel.transport, function(){
								tran = this;
								
								let selTrans = sel.fromComponent.transports.filter(function(f){
									return f.type == tran.type;
								})[0];
						
								
								let tCount = tArray.filter(function(ttt){
									return ttt.type == selTrans.type;
								}).length;
							
								if( tCount == 1 ){
									tArray[0].quantity = tran.quantity;
									tArray[0].calcCapacity = tran.quantity * selTrans.capacity;
									if(selTrans.addPoints) {
										tArray[0].addPoints = tran.quantity * selTrans.addPoints;
									}
								} else {
									if(selTrans.addPoints) {
										tArray.push({"type": tran.type, "quantity": tran.quantity, "calcCapacity": tran.quantity * selTrans.capacity, "addPoints": tran.quantity * selTrans.addPoints});
									} else {
										tArray.push({"type": tran.type, "quantity": tran.quantity, "calcCapacity": tran.quantity * selTrans.capacity});
									}
								}

								calcCapacity += tran.quantity * selTrans.capacity;		//total for checking vs consume
							});
						}
					});

					let tt = '';

					$.each(tArray, function(){
						let ttrans = this;
						tt += '<div id="divSelectionItem_' + formation.id + '_' + iid + '_' + ttrans.type + '" class="divSelectionItem divTransSelect">';
						tt += '<div class="divSelectionItemTransTop">';
						tt += '<div class="divSelectionName">' + ttrans.type  + ' (' + ttrans.quantity + ')</div>';

						if(ttrans.addPoints){
							tt += '<div class="divSelectionPoints">' + ttrans.addPoints + '</div>';
							formationTotal += ttrans.addPoints;
						} else { 
							tt += '<div class="divSelectionPoints"></div>';
						}

						tt += '</div>';
						tt += '</div>';
					});
					// re transport elements
					// /////////////////////
					
					if(unitType.addPoints){
						let ap = unitType.addPoints.filter(function(a){
							return (q >=  a.min && q <= a.max) || a.each;
						});

						if(ap.length == 1){
							if( ap[0].each ){
								a += ap[0].points * (q / ap[0].each);
							} else {
								a += ap[0].points;
							}
						}
					}

					
					// ok, just a note on this because i'll forget in an hour...
					// what the above is doing is combining all the same type units within the upgrade item
					// this means we don't have '1 Tactical Dreadnought' and then '1 Tactical Dreadnought' on the next line, which is actually how the 'data' is stored.
					// we just show one line saying '2 Tactical Dreadnought'
					// now each of those individual items has an id, and this is used to allow deletion of the item off the grid.
					// however becuase we're concatenating the data we only have one id to use (the last one through the for loop.
					// this is not a problem however as each of the units/selected items are exactly the same (or they won't be combining in the first place.
					// they are fungable. yhay. i love using that word.
					// if they are of the same upgrade but different unit types, i.e. 'Hellfire' vs 'Tactical' then they each get their own line.
					
					ss += '<div id="divSelectionItem_' + formation.id + '_' + iid + '" class="divSelectionItem">';
					ss += '<div class="divSelectionItemTop">';
					ss += '<div class="divSelectionName">' + q  + ' ' + n + '</div>';

					if(a > 0){
						ss += '<div class="divSelectionPoints">' + a + '</div>';
						formationTotal += a;
					} else { 
						ss += '<div class="divSelectionPoints"></div>';
					}
					ss += '</div>';
					ss += '</div>';

					if( tt != '' ) {
						ss += tt;
					}
				}
			});
		});

		s += '	<div class="divSelectionUnits">' + ss + '</div>';
		s += '</div>';

		$('#divSelectionsContent').append(s);

		formation.formationTotal = formationTotal;
		$('#divSelection_'+formation.id).find('.divSelectionTop').find('.divSelectionPoints').html(formation.formationTotal);

		$('.divSelectionItem:odd').css("background-color", "#dddddd");
		$('.divSelectionItem:even').css("background-color", "#cccccc");
		
		army.grandTotal += formation.formationTotal;
		$('.divSelectionsPoints').html(army.grandTotal + ' pts');
		
		army.diffPoints = army.calcPoints - army.grandTotal;
		$('.divSelectionsDiffPoints').html('(' + army.diffPoints + ') pts');
		if( army.diffPoints > 0 ){
			$('.divSelectionsDiffPoints').addClass('divDiffPositive');
		} else {
			$('.divSelectionsDiffPoints').addClass('divDiffNegative');
		}
		
	});

	
	// //////////////////
	// check contstraints
	let w = '';
	let msgs = checkConstraint_maxSelected(null, true);		// this case should never happen, controlled by menu deactivation
	if(msgs){
		$.each(msgs, function(){
			let msg = this;
			w = w + " " + msg.wtext + '<br>';
		});
	}

	msgs = checkConstraint_maxPercentage(null, true);
	if(msgs){
		$.each(msgs, function(){
			let msg = this;
			w = w + " "+ msg.wtext + '<br>';
		});
	}

	msgs = checkConstraint_formationRatio(null, true);
	if(msgs){
		$.each(msgs, function(){
			let msg = this;
			w = w + " "+ msg.wtext + '<br>';
		});
	}

	msgs = checkConstraint_formationRatioLimit(null, true);
	if(msgs){
		$.each(msgs, function(){
			let msg = this;
			w = w + " "+ msg.wtext + '<br>';
		});
	}

	msgs = checkConstraint_mandatoryUnit(null, true);
	if(msgs){
		$.each(msgs, function(){
			let msg = this;
			w = w + " "+ msg.wtext + '<br>';
		});
	}

	if(w != '' ){
		$('.divWarnings').html('<br>' + w);
		$('.divWarnings').show();
	}
	// check contstraints
	// //////////////////


	// this is for setting the army name with a text input
	// ///////////////////////////////////////////////////
	$('.divArmyName').unbind("click");
	$('.divArmyName').click(function () {

		if(!army.textOn){
			$('.divArmyName').html('<input type="text" class="inputArmyName"/>');
			$('.inputArmyName').val(army.name);
			$('.inputArmyName').focus();
			army.textOn = true;
		} else  {
			if( $('.inputArmyName').val() == '' ) {
				army.name = 'testArmy';
			} else {
				army.name = $('.inputArmyName').val();
			}
			$('.divArmyName').html(army.name);
			army.textOn = false;
		}
	});

	$('.divCalcPoints').unbind("click");
	$('.divCalcPoints').click(function () {
		if(!army.calcOn){
			$('.divCalcPoints').html('<input type="text" class="inputCalcPoints"/>');
			$('.inputCalcPoints').val(army.calcPoints);
			$('.inputCalcPoints').focus();
			army.calcOn = true;
		} else  {
			if( $('.inputCalcPoints').val() == '' ) {
				army.calcPoints = 3000;
			} else {
				army.calcPoints = $('.inputCalcPoints').val();
			}
			$('.divCalcPoints').html(army.calcPoints);
			army.calcOn = false;
			drawSelection();
		}
	});
	
	// this is for swapping units types within the core selection
	// //////////////////////////////////////////////////////////
	$('.divSelectionItem').not('.divTransSelect').unbind("hover");
	$('.divSelectionItem').not('.divTransSelect').hover(
		function (){
			$('.divPopup').html('');
			$('.divPopup').hide();

			let that = this;
			
			if(debounceHover) clearTimeout(debounceHover);
			debounceHover = setTimeout(function(){
				buildPopup(that, -1, -1);
			},600);
		},
		function(){
			if(debounceHover) clearTimeout(debounceHover);
		}
	);

	// this is selecting upgrade options
	// /////////////////////////////////
	$('.divSelectionPrimary').not('.divSelectionButton').unbind("hover");
	$('.divSelectionPrimary').not('.divSelectionButton').hover(
		function (){
			$('.divPopup').html('');
			$('.divPopup').hide();

			let that = this;

			if(debounceHover) clearTimeout(debounceHover);
			debounceHover = setTimeout(function(){
				buildPopupXX(that, -1, -1);
			},600);
		},
		function(){
			if(debounceHover) clearTimeout(debounceHover);
		}
	);
	// this is selecting upgrade options
	// /////////////////////////////////


	// remove a main selection object
	$('.divSelectionTop').unbind("click");
	$('.divSelectionTop').click(function () {
		let id = this.parentElement.parentElement.id.split('_')[1];

		army.objects = army.objects.filter(function(f){
			return f.id != id || f.isMandatory;
		});

		drawSelection();
		drawFormations();
	});


	// remove transport selections
	$('.divTransSelect').unbind("click");
	$('.divTransSelect').click( function(){
		let formationId = this.id.split('_')[1];
		let selectionId = this.id.split('_')[2];
		let tranTypeId = this.id.split('_')[3];

		let formation = army.objects.filter(function(f){
			return f.id == formationId;
		})[0];
		
		let sel = formation.selection.filter(function(s){
			return s.id == selectionId;
		})[0];

		let tran = sel.transport.filter(function(t){
			return t.type == tranTypeId;
		})[0];

		if( tran.quantity - 1 > 0 ){
			tran.quantity--;
		} else {
			sel.transport = sel.transport.filter(function(t){
				return t.type != tranTypeId;
			});
			
			if( sel.transport.length == 0 ){
				delete sel.transport;
			}
		}

		drawSelection();
	});


	// remove an upgrade object
	$('.divSelectionItemTop').unbind("click");
	$('.divSelectionItemTop').click( function(){
		let formationId = this.parentElement.id.split('_')[1];
		let selectionId = this.parentElement.id.split('_')[2];

		let formation = army.objects.filter(function(f){
			return f.id == formationId;
		})[0];
		
		let sel = formation.selection.filter(function(s){
			return s.id == selectionId;
		})[0];


		// ok, with multi-upgrades with vehicles...
		// if you have 3 x (2)neophytes and they have 3 x rhinos between them
		// these are all stored on the neophyte[0] record.
		// backtrack a little... each (2)neophyte which has been selected has a separate record, and there are 3 of them, 
		// there isn't 1 record with a quantity of 6...
		// [0] - (2)neophyte    transport [{...},{...}]
		// [1] - (2)neophyte
		// [2] - (2)neophyte
		// all transport records for a single type (neophyte1) are stored on the zeroth record.
		// if you remove a neophyte upgrade it removes the zeroth record (neophyte[0]), 
		// which effectively removes all the transports for any neophtye1, or 'resets' it.  
		// i actually don't mind this...
		// and prefer it to having an oversupply on selected transports which 
		// would then need a warning to rectify it.
		// if you removed the 'last' (2nd in this example) item then you would have 3 rhinos for 4 neophytes (2x (2)neophyte)
		// which is 1 more rhino than permitted... better, i think, to kludge the transport
		// records entirely and start building the transport options again for that upgrade.
 
		if( sel.fromComponent.type != "core" ) {
			formation.selection = formation.selection.filter(function(s){
				return s.id != selectionId;
			});

			drawSelection();
		}
	});
}

function buildPopup(thisControl, posTop, posLeft, passFormationId, passFromType, passToType){

	let formationId = null;
	let selectionId = null;
	let ctrl = null;

	if(passFormationId && passFromType && passToType){
		formationId = passFormationId;

		let formation = army.objects.filter(function(f){
			return f.id == formationId;
		})[0];

		if(formation){
			let sel = formation.selection.filter(function(s){
				return s.type == passFromType;
			})[0];
			if(sel){
				selectionId = sel.id;
			}
		}
	} else {
		ctrl = $('#' + thisControl.id)[0];
		formationId = ctrl.id.split('_')[1];
		selectionId = ctrl.id.split('_')[2];
	}

	if( posTop == -1 ){
		var offset = $(ctrl).offset();
		posTop = offset.top - $(window).scrollTop();
		posLeft = offset.left - $(window).scrollLeft() + 200;
	}

	let formation = army.objects.filter(function(f){
		return f.id == formationId;
	})[0];

	if(formation){
		let sel = formation.selection.filter(function(s){
			return s.id == selectionId;
		})[0];

		// /////////////////////
		// re transport elements
		let selOfType = formation.selection.filter(function(s){
			return s.unitId == sel.unitId;
		});

		let calcConsume = 0;
		let calcCapacity = 0;
		$.each(selOfType, function(){
			let sot = this;
			if( sot.fromComponent.consume ){
				calcConsume += Number(sot.fromComponent.consume) * Number(sot.quantity);
			}

			if(sot.transport){
				$.each(sot.transport, function(){
					tran = this;

					let selTrans = sot.fromComponent.transports.filter(function(f){
						return f.type == tran.type;
					})[0];
					calcCapacity += tran.quantity * selTrans.capacity;
				});
			}
		});

		// handle transport popup and clickity
		if(sel.fromComponent.transports){
			let s = '';

			$.each(sel.fromComponent.transports, function(){
				let t = this;

				let deactivate = false;
				let addText2 = '';
				let msgs2 = checkConstraint_upgradeMutualExclusion(formation, t, false);
				if(msgs2){
					$.each(msgs2, function(){
						let msg = this;
						if( msg.state == "exclude" ){
							deactivate = true;
							addText2 = msg.wtext;
						}
					});
				}

				s += '<div id="divPopupSelect_' + formationId + "_" + selectionId + '_' + t.type + '" class="divPopupSelect ' + (calcConsume > calcCapacity && ! deactivate ? 'divPopupOn': 'divPopupOff')+ '">';
				s += '	<div class="divPopupSelectName">' + t.type + (addText2 == '' ? '' : ' ' + addText2) + '</div>';
				s += '	<div class="divPopupSelectPoints">cap:' + t.capacity + '</div>';
				s += '</div>';
			});

			$('.divPopup').html(s);
			$('.divPopup').show();
			$('.divPopup').css( {top: posTop, left: posLeft} );
			$('.divPopupSelect:odd').css("background-color", "#dddddd");
			$('.divPopupSelect:even').css("background-color", "#cccccc");


			// handle transport selection - add transport to element
			$('.divPopupOn').unbind("click");
			$('.divPopupOn').click(function () {
				let transportType = this.id.split('_')[3];

				if( sel.transport) {
					let tran = sel.transport.filter(function(tt){
						return tt.type == transportType;
					});

					if( tran.length == 1 ){
						tran[0].quantity = tran[0].quantity + 1;
					} else {
						sel.transport.push({"type": transportType, "quantity": 1});
					}
				} else {
					sel.transport = [];
					sel.transport.push({"type": transportType, "quantity": 1});
				}

				drawSelection();
				buildPopup(thisControl, posTop, posLeft);
			});
		}
		// re transport elements
		// /////////////////////


		//  handle core items swapables....
		if(sel.fromComponent.type == "core") {
			//only allow swap, if swappable
			if( sel.fromComponent.units.length > 1 ){

				// build the swap list
				// ///////////////////
				let s = '';
				$.each(sel.fromComponent.units, function(){
					let obj = this;
								
					let ap = '';
					if(obj.addPoints){
						if(obj.addPoints.length == 1){
							ap = obj.addPoints[0].points;
						} else {
							$.each(obj.addPoints, function(){
								let aa = this;
								let ab = (aa.min == aa.max ? aa.max + '@' + aa.points : aa.min + '-' + aa.max + '@' + aa.points);
								ap = (ap != '' 	? ap + ',' + ab : ab);
							});
						}
					}
					
					let deactivate = false;
					let addText4 = '';
					let msgs4 = checkConstraint_upgradeLimit(formation, obj, false);
					if(msgs4){
						$.each(msgs4, function(){
							let msg = this;
							if( msg.state == "reached" ){
								deactivate = true;
								addText4 = msg.wtext;
							}
						});
					}			

					if( obj.quantity <= sel.quantity && obj.id != sel.unitId) {
						s += '<div id="divPopupSelect_' + formationId + "_" + selectionId + '_' + obj.id + '" class="divPopupSelect ' + (deactivate ? 'divPopupOff' : 'divPopupOn') + '">';
						s += '	<div class="divPopupSelectName">' + obj.type + (obj.quantity > 1 ? ' (' + obj.quantity + ')' : '') + (addText4 == '' ? '' : ' '+ addText4) + '</div>';
						s += '	<div class="divPopupSelectPoints">' + (ap ? ap : '') + '</div>';
						s += '</div>';
					}
				});

				$('.divPopup').html(s);
				$('.divPopup').show();
				$('.divPopup').css( {top: posTop, left: posLeft} );
				$('.divPopupSelect:odd').css("background-color", "#dddddd");
				$('.divPopupSelect:even').css("background-color", "#cccccc");

				
				$('.divPopupSelect').unbind("click");
				$('.divPopupSelect').click(function () {
					let formationId = this.id.split('_')[1];
					let fromId = this.id.split('_')[2];
					let toType = this.id.split('_')[3];
					let isEmptySelection = false;
					
					let selFrom = formation.selection.filter(function(s){
						return s.id == fromId;
					})[0];

					let unitType = selFrom.fromComponent.units.filter(function(u){
						return u.id == toType;
					})[0];

					selFrom.quantity -= Number(unitType.quantity);

					let selExist = formation.selection.filter(function(s){
						return s.id == toType;
					})[0];


					if(selExist) {
						selExist.quantity = Number(selExist.quantity) + Number(unitType.quantity);
					} else {
						formation.selection.push(
							{
								"id": army.udx,
								"type": unitType.type,
								"quantity": unitType.quantity,
								"fromComponent": selFrom.fromComponent,
								"unitId": unitType.id
							}
						);
						army.udx++;
					}

					if( selFrom.quantity == 0 ){
						formation.selection = formation.selection.filter(function(s){
							return s.id != selFrom.id;
						});
					}

					let sFrom = formation.selection.filter(function(s){
						return s.type == selFrom.type;
					});

					if(sFrom <= 0){
						isEmptySelection = true;					
					}

					drawSelection();
					if(isEmptySelection){
						$('.divPopup').html('');
						$('.divPopup').hide();
					} else {
						buildPopup(thisControl, posTop, posLeft, formationId, selFrom.type, unitType.type);
					}
				});
			}
		}
	}

	$('.divPopup').unbind("mouseleave");
	$('.divPopup').mouseleave(function () {
	 	$('.divPopup').html('');
		$('.divPopup').hide();
	});
}

function buildPopupXX(thisControl, posTop, posLeft){

	let ctrl = $(thisControl)[0];

	let formationId = ctrl.parentElement.id.split('_')[1];

	if( posTop == -1 ){
		var offset = $(ctrl).offset();
		posTop = offset.top - $(window).scrollTop();
		posLeft = offset.left - $(window).scrollLeft() + 200;
	}

	let formation = army.objects.filter(function(f){
		return f.id == formationId;
	})[0];


	if(formation){
		let showPopup = false;
		let s = '';
		$.each(formation.class.composition, function(){
			let obj = this;

			if( obj.type != 'core' ){
				$.each(obj.units, function(){

					let unit = this;

					let deactivate = false;
					let findExisting = formation.selection.filter(function(c){
						return c.fromComponent == obj;
					});
					if(findExisting.length > 0){
						if(findExisting.length >= findExisting[0].fromComponent.max){
							deactivate = true;
						}
					}
								
					let ap = '';
					if(unit.addPoints){
						if(unit.addPoints.length == 1){
							ap = unit.addPoints[0].points;
						} else {
							$.each(unit.addPoints, function(){
								let aa = this;
								let ab = (aa.min == aa.max ? aa.max + '@' + aa.points : aa.min + '-' + aa.max + '@' + aa.points);
								ap = (ap != '' 	? ap + ',' + ab : ab);
							});
						}
					}								

					let addText = '';
					let msgs = checkConstraint_upgradeMaxSelected(unit.type, false);
					if(msgs){
						$.each(msgs, function(){
							let msg = this;
							if( msg.state == "reached" ){
								deactivate = true;
								addText = msg.wtext;
							}
						});
					}

					let addText2 = '';
					let msgs2 = checkConstraint_upgradeMutualExclusion(formation, unit, false);
					if(msgs2){
						$.each(msgs2, function(){
							let msg = this;
							if( msg.state == "exclude" ){
								deactivate = true;
								addText2 = msg.wtext;
							}
						});
					}

					let addText3 = '';
					let msgs3 = checkConstraint_upgradeRatio(formation, false);
					if(msgs3){
						$.each(msgs3, function(){
							let msg = this;
							if( msg.state == "reached" ){
								deactivate = true;
								addText3 = msg.wtext;
							}
						});
					}

					s += '<div id="divPopupSelect_' + formationId + '_' + findExisting.id + '_' + unit.id + '" class="divPopupSelect' + (deactivate ? ' divPopupOff' : ' divPopupOn' )+ '">';
					s += '	<div class="divPopupSelectName">' + unit.type + (unit.quantity > 1 ? ' (' + unit.quantity + ')' : '') + (addText == '' ? '' : ' '+ addText) + (addText2 == '' ? '' : ' '+ addText2) + (addText3 == '' ? '' : ' '+ addText3) + '</div>';
					s += '	<div class="divPopupSelectPoints">' + (ap == 0 ? '' : ap) + '</div>';
					s += '</div>';

					showPopup = true;
				});
			}
		});

		if(showPopup){
			$('.divPopup').html(s);
			$('.divPopup').show();
			$('.divPopup').css( {top: posTop, left: posLeft} );
			$('.divPopupSelect:odd').css("background-color", "#dddddd");
			$('.divPopupSelect:even').css("background-color", "#cccccc");
		}


		// handle upgrade (non-transport) selection - add upgrade to selection
		$('.divPopupOn').unbind("click");
		$('.divPopupOn').click(function () {
			let formationId = this.id.split('_')[1];
			let fromId = this.id.split('_')[2];
			let toType = this.id.split('_')[3];

			let component = null;
			let selected = null;
			let transObj = null;
			for( var i = 0; i < formation.class.composition.length; i++){
				for( var ii = 0; ii < formation.class.composition[i].units.length; ii++){
					if( formation.class.composition[i].units[ii].id == toType ){
						component = formation.class.composition[i];
						selected = formation.class.composition[i].units[ii];
					}
				}
			}

			if (selected != null ){

				// add default transports if specified in the army chart
				if(component.transports){
					let defaultTransport = component.transports.filter(function(tt){
						return tt['default'];
					});
					if(defaultTransport.length > 0){
						transObj = {"type": defaultTransport[0].type, "quantity": (component.units[0].quantity) / defaultTransport[0].capacity }
					}
				}

				let newSel = {
						"id": army.udx,
						"type": selected.type,
						"quantity": selected.quantity,
						"fromComponent": component,
						"unitId": selected.id
					};

				if( transObj ){
					let existingTrans = false;
					let filterSel = formation.selection.filter(function(sss){
						return sss.unitId == selected.id;
					});
					
					if( filterSel.length > 0 ){

						if( filterSel[0].transport) {
							let filterTrans = filterSel[0].transport.filter(function(ttt){
								return ttt.type == transObj.type;
							});

							if( filterTrans.length > 0 ){
								filterTrans[0].quantity  += transObj.quantity;
								existingTrans = true;
							}
						} else {
							filterSel[0].transport = [];
							filterSel[0].transport.push(transObj);
							existingTrans = true;
						}
					}
					
					if(!existingTrans){
						newSel.transport = [];
						newSel.transport.push(transObj);
					}
				}

				formation.selection.push(newSel);
				army.udx++;

				drawSelection();
				buildPopupXX(thisControl, posTop, posLeft);
			}
		});
	}

	$('.divPopup').unbind("mouseleave");
	$('.divPopup').mouseleave(function () {
	 	$('.divPopup').html('');
		$('.divPopup').hide();
	});
}



/*
function getDistance(p1X, p1Y, p2X, p2Y) {
	var returnValue = Math.sqrt( Math.pow((p1X - p2X), 2) + Math.pow((p1Y - p2Y), 2));
	return returnValue;
}

function getObject( thisArray, thisParameter, thisValue ) {

	var returnValue = null;
	
	$.each(thisArray, function() {

		if( this[thisParameter].toLowerCase() == thisValue.toLowerCase() ) {
			returnValue = this; 
		}
	});

	return returnValue;
}

function getRandom(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
*/
