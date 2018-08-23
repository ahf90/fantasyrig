var defaultCats = {
	'rosBat': ['FP','AVG', 'OBP', 'SLG', 'OPS', 'wOBA'],
	'rosPitch': ['FP','ERA', 'WHIP','K/9', 'BB/9', 'FIP'],
	'lastBat': ['K%', 'BB%', 'BABIP', 'ISO', 'wOBA', 'wRC+'],
	'lastPitch': ['K%', 'BB%', 'BABIP', 'FIP', 'xFIP', 'SIERA'],
  'threeBat': ['K%', 'BB%', 'BABIP', 'ISO', 'wOBA', 'wRC+'],
	'threePitch': ['K%', 'BB%', 'BABIP', 'FIP', 'xFIP', 'SIERA'],
	'currBat': ['K%', 'BB%', 'BABIP', 'ISO', 'wOBA', 'wRC+'],
	'currPitch': ['K%', 'BB%', 'BABIP', 'FIP', 'xFIP', 'SIERA']
};

$("#save").on('click', function() {
	$( "#saveSuccess" ).text('Saving . . .');
	var settingsStorage = {
		'currBat' : [],
		'currPitch' : [],
		'lastBat' : [],
		'lastPitch' : [],
    'threeBat' : [],
		'threePitch' : [],
		'rosBat' : [],
		'rosPitch' : []
	}

	$.each(settingsStorage, function( key, value ) {
		$( "#" + key).find("input:checked").each(function( index ) {
			settingsStorage[key].push($(this).val());
		});
	});

	var rosValue = $('input[name=rosSourceRadio]:checked').val();

	chrome.storage.local.set({'rosSource':rosValue}, function() {
		chrome.storage.local.set(settingsStorage, function() {
			$( "#saveSuccess" ).text('Settings Saved!');
		});
	});
});

$("input").one('click', function() {
	$("#saveSuccess").text("Click 'Submit Changes' to save");
	$("#save").text('Submit Changes');
	$("#save").removeAttr('disabled');
});

$("input:radio").change( function() {
	$("#saveSuccess").text("Click 'Submit Changes' to save");
	$("#save").text('Submit Changes');
	$("#save").removeAttr('disabled');
});

chrome.storage.local.get('rosSource', function (result) {
	if (!result['rosSource']) {
		$("#depthCharts").prop("checked", true);
		$("#depthCharts").parent().addClass("active");
		
	} else {
		$("#sourceRadios").find('input').each(function () {
			if ($(this).val() == result['rosSource']) {
				$(this).prop("checked", true);
				$(this).parent().addClass("active");
			}
		});
	}
});	

$.each(['currBat','currPitch','rosBat','rosPitch','lastPitch','lastBat','threeBat','threePitch'], function( index, value ) {
	chrome.storage.local.get(value, function (result) {
		var currentArray = result[value];
		if (typeof(currentArray) === 'undefined' || currentArray.length == 0) {
			currentArray = defaultCats[value];
		}
		$( "#" + value).find('input').each(function( ind ) {
			if (currentArray.includes($( this ).val())) {
				$( this ).prop('checked', true);
			}
		});
		
	});	
});
	
	
	
