


var data;
var army = {
	name: 'testArmy',
	idx: 0,
	udx: 0,		// for selections
	odx: 0,		// for flagging each unit type so they can be identified within the program
	objects: [],
	grandTotal: 0,
	textOn: false
};
var stats = null;
var references = null;

var debounceHover = null;

$(document).ready(function() {

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

	var armyListFile = './armyList/BT.json';
	loadFile('main', armyListFile);
});


function loadFile(mode, fileName){
	$.ajax({
		url: fileName,
		mimeType: "application/json"
	}).done(function(response) {
		switch(mode){
			case 'main':
				data = response;
				initSelections();
				$('#gridView').click();
			
				loadFile('army', data.includeFiles.primary);
				loadFile('reference', data.includeFiles.common[0]);
				break;
			case 'army':
				stats = response;
				break;
			case 'reference':
				references = response;
				break;
		}
	}).fail(function(data){
		console.log('failure');
		console.log(data)
	});
}


function compileStatView(showArmySpecialRules){

	let s = '';

	s += army.name + ', ' + army.grandTotal + ' POINTS';
	s += '<br>';
	s += data.faction + ' - ' + data.id + ' (' + data.version + ')';
	s += '<br>';
	s += '<br>';
	
	s += stats.armyStats.initiative;
	s += '<br>';
	s += stats.armyStats.strategy;
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
		
		
		s += '<table>';
		s += drawRowHeaders();
		$.each(uniqueItems, function(){
			let uItem = this;
			s += drawRow(uItem);
		});
		s += '</table>';

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

			let thisRule = stats.specialRules.filter(function(sp){
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
	sx += '<th>name</th>';
	sx += '<th>type</th>';
	sx += '<th>armour</th>';
	sx += '<th>cc</th>';
	sx += '<th>ff</th>';
	sx += '<th>weapons</th>';
	sx += '<th>specialRules</th>';
	sx += '</tr>';
	return sx;
}

function drawRow(thisName){

	let sx = '';
	
	// find the stats item
	let sFilter = stats.units.filter(function(su){
		return su.name == thisName;
	});

	if(sFilter.length == 1){
		let statUnit = sFilter[0];

		sx += '<tr>';
		sx += '<td>' + statUnit.name + '</td>';
		sx += '<td>' + statUnit.type + '</td>';
		sx += '<td>' + statUnit.armour + '</td>';
		sx += '<td>' + statUnit.cc + '</td>';
		sx += '<td>' + statUnit.ff + '</td>';
		sx += '<td>' + statUnit.weapons + '</td>';
		sx += '<td>' + (statUnit.specialRules ? statUnit.specialRules : '') + '</td>';
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


		// hand on to this methodology, it's pretty sweet...
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

			s += '<div class="divFormation' + (msg.length > 0 ? ' divSelectionOff' : '') + '">';
			s += '	<div class="divFormationName">' + formation.name  + (msg.length > 0 ? ' ' + msg[0].wtext : '') + '</div>';
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
				"wtext": "WARNING : " + 'Percentage exceeded : ' + constraint.name + ' : Max ' + constraint.maxPercent + '%'
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

function addSelection(formationName, isMandatory){

	let xClass = findFormation(formationName);

	let defaults = [];

	$.each(xClass.composition, function(){
		let component = this;
		if( component.type == 'core') {
			if( component.min > 0 ){
				defaults.push(
					{
						"id": army.udx,
						"type": component.units[0].type,
						"quantity": (component.units[0].quantity * component.max),
						"fromComponent": component,
						"unitId": component.units[0].id,
						"formationTotal": component.points
					}
				);
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
	
	// check formationConstrains and if at maximum selection allowed, then disable this option.
	
	
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

	let ss = '';
	ss += '<div><div class="divSelectionsTitle"><b><div class="divArmyName">' + army.name + '</div></b></div><div class="divSelectionsPoints"></div></div>';
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

		$('.divSelectionItem:even').css("background-color", "#cccccc");
		
		army.grandTotal += formation.formationTotal;
		$('.divSelectionsPoints').html(army.grandTotal + ' pts');
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
	
	// this is for swapping units types within the core selection
	// //////////////////////////////////////////////////////////
	$('.divSelectionItem').not('.divTransSelect').unbind("hover");
	$('.divSelectionItem').not('.divTransSelect').hover(
		function (){
			var posTop = $(this).position().top + this.clientHeight;
			var posLeft = $(this).position().left;

			let formationId = this.id.split('_')[1];
			let selectionId = this.id.split('_')[2];

			let that = this;

			if(debounceHover) clearTimeout(debounceHover);
			debounceHover = setTimeout(function(){

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
						let s = '<div class="divPopup">';

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
							$(that).append(s);
						});
						
						s += '</div>';
						
						$('.divPopup').css( {top: posTop, left: posLeft} );

						$('.divPopupSelect:even').css("background-color", "#cccccc");

// HERE HERE HERE HERE
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
						});
					}
					// re transport elements
					// /////////////////////

					
					
					//  handle core items swapables....
					if( sel.fromComponent.type == "core" ) {
						//only allow swap, if swappable
						if( sel.fromComponent.units.length > 1 ){

							// build the swap list
							// ///////////////////
							let s = '<div class="divPopup">';
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

								if( obj.quantity <= sel.quantity && obj.id != sel.unitId) {
									s += '<div id="divPopupSelect_' + formationId + "_" + selectionId + '_' + obj.id + '" class="divPopupSelect divPopupOn">';
									s += '	<div class="divPopupSelectName">' + obj.type + (obj.quantity > 1 ? ' (' + obj.quantity + ')' : '') + '</div>';
									s += '	<div class="divPopupSelectPoints">' + (ap ? ap : '') + '</div>';
									s += '</div>';
								}
							});
							s += '</div>';

							$(that).append(s);

							$('.divPopup').css( {top: posTop, left: posLeft} );
							
							$('.divPopupSelect:even').css("background-color", "#cccccc");

// HERE HERE HERE HERE
							// click a swap selection
							// //////////////////////
							$('.divPopupSelect').unbind("click");
							$('.divPopupSelect').click(function () {
								let formationId = this.id.split('_')[1];
								let fromId = this.id.split('_')[2];
								let toType = this.id.split('_')[3];

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

								drawSelection();
							});
						}
					}
				}
			},600);
		},
		function(){
			if(debounceHover) clearTimeout(debounceHover);			
			$('.divPopup').remove();
		}
	);
	
	
	// this is selecting upgrade options
	// /////////////////////////////////
	$('.divSelectionPrimary').unbind("hover");
	$('.divSelectionPrimary').hover(
		function (){

			var posTop = $(this).position().top + this.clientHeight;
			var posLeft = $(this).position().left;

			let idFormation = this.parentElement.id.split('_')[1];

			let that = this;

			if(debounceHover) clearTimeout(debounceHover);
			debounceHover = setTimeout(function(){

				let formation = army.objects.filter(function(f){
					return f.id == idFormation;
				})[0];

				if(formation){
					let showPopup = false;
					let s = '<div class="divPopup">';
					$.each(formation.class.composition, function(){
						let obj = this;

						if( obj.type != 'core'){
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

								s += '<div id="divPopupSelect_' + idFormation + '_' + findExisting.id + '_' + unit.id + '" class="divPopupSelect' + (deactivate ? ' divPopupOff' : ' divPopupOn' )+ '">';
								s += '	<div class="divPopupSelectName">' + unit.type + (unit.quantity > 1 ? ' (' + unit.quantity + ')' : '') + (addText == '' ? '' : ' '+ addText) + (addText2 == '' ? '' : ' '+ addText2) + '</div>';
								s += '	<div class="divPopupSelectPoints">' + ap + '</div>';
								s += '</div>';

								showPopup = true;
							});
						}
					});
					s += '</div>';

					if(showPopup){
						$(that).append(s);
					}
				
					$('.divPopup').css( {top: posTop, left: posLeft} );

					$('.divPopupSelect:even').css("background-color", "#cccccc");


// HERE HERE HERE HERE
					$('.divPopupOn').unbind("click");
					$('.divPopupOn').click(function () {
						let formationId = this.id.split('_')[1];
						let fromId = this.id.split('_')[2];
						let toType = this.id.split('_')[3];

						let component = null;
						let selected = null;
						for( var i = 0; i < formation.class.composition.length; i++){
							for( var ii = 0; ii < formation.class.composition[i].units.length; ii++){
								if( formation.class.composition[i].units[ii].id == toType ){
									component = formation.class.composition[i];
									selected = formation.class.composition[i].units[ii];
								}
							}
						}

						if (selected != null ){
							formation.selection.push(
								{
									"id": army.udx,
									"type": selected.type,
									"quantity": selected.quantity,
									"fromComponent": component,
									"unitId": selected.id
								}
							);
							army.udx++;

							drawSelection();					
						}
					});
				}				
			},600);
		},
		function(){
			if(debounceHover) clearTimeout(debounceHover);		
			$('.divPopup').remove();
		}
	);

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
		// [0] - (2)neophyte    transport [{...}]
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
		// records entirely and start building the transport options again.
 		
		if( sel.fromComponent.type != "core" ) {
			formation.selection = formation.selection.filter(function(s){
				return s.id != selectionId;
			});

			drawSelection();
		}
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
