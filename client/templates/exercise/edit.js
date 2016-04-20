(function () {
	'use strict';

	let createType;

	Template.exerciseEdit.onCreated(() => createType = new ReactiveVar(null));

	Template.exerciseEdit.onRendered(function () {
		$('#nav-exercise-create').click(ev => createType.set(null));
	});

	Template.exerciseEdit.helpers(
		{
			exerciseTypes: () => Progressor.getExerciseTypes(),
			exerciseType(exercise) {
				const type = createType.get() || Progressor.getExerciseType((exercise.exercise_id ? exercise.exercise : exercise).type);
				return type ? `${type.template}Edit` : null;
			}
		});

	Template.exerciseEdit.events(
		{
			'change #select-type': ev => createType.set(Progressor.getExerciseType(parseInt($(ev.currentTarget).val())))
		});

})();