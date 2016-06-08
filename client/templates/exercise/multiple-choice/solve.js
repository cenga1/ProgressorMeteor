(function () {
	'use strict';

	function tmpl() {
		return Template.instance();
	}

	function getExercise(forceRefresh = false) {
		return tmpl().isResult.get() && !forceRefresh ? Progressor.results.findOne().exercise : Progressor.exercises.findOne();
	}

	function getResult() {
		if (tmpl().isResult.get())
			return Progressor.results.findOne();
	}

	function getEvaluationResults() {
		if (tmpl().isResult.get() || (Progressor.results.find().count() && Progressor.exercises.findOne().lastEdited.getTime() === Progressor.results.findOne().exercise.lastEdited.getTime()))
			return Progressor.results.findOne().results;
		else
			return tmpl().evaluationResults.get();
	}

	Template.multipleSolve.onCreated(function () {
		this.isResult = new ReactiveVar(false);
		this.evaluationResults = new ReactiveVar([]);
	});

	function getExecutionExercise(offset) {
		const execution = Progressor.executions.findOne();
		let exerciseIndex = -1;
		if (execution && _.any(execution.exercises, (e, i) => (exerciseIndex = e.exercise_id === getExercise()._id ? i : exerciseIndex) >= 0) && execution.exercises[exerciseIndex + offset])
			return { _id: execution.exercises[exerciseIndex + offset].exercise_id };
	}

	Template.multipleSolve.onCreated(function () {
		this.progressUpdateInterval = -1;
		this.progress = { activities: 0 };

		if (!tmpl().isResult.get())
			this.autorun(() => {
				const exercise = getExercise(true);
				if (exercise)
					Meteor.call('openedExercise', exercise, Progressor.handleError());

				Meteor.clearInterval(this.progressUpdateInterval);
				this.progressUpdateInterval = Meteor.setInterval(() => {
					if (exercise) {
						Meteor.call('updateExerciseProgress', exercise, this.progress, Progressor.handleError());
						this.progress.activities = 0;
					}
				}, Progressor.RESULT_LOG_PROGRESS_UPDATE_INTERVAL);
			});
	});

	Template.multipleSolve.onDestroyed(function () {
		Meteor.clearInterval(this.progressUpdateInterval);
	});

	Template.multipleSolve.helpers(
		{
			safeExercise(exerciseOrResult) {
				tmpl().isResult.set(exerciseOrResult.exercise_id);
				return exerciseOrResult.exercise_id ? exerciseOrResult.exercise : exerciseOrResult;
			},
			isResult: () => tmpl().isResult.get(),
			canEdit: e => !tmpl().isResult.get() && (e.author_id === Meteor.userId() || Roles.userIsInRole(Meteor.userId(), Progressor.ROLE_ADMIN)),
			exerciseSearchData: () => ({ _id: getExercise().programmingLanguage }),
			exerciseSolveData: () => ({ _id: getResult() ? getResult().exercise_id : getExercise()._id }),
			previousExerciseSolveData: () => getExecutionExercise(-1),
			nextExerciseSolveData: () => getExecutionExercise(+1),
			changedAfterSolved: () => getExercise(true) && getResult() && getExercise(true).lastEdited > getResult().solved,
			resultSolved: () => getResult().solved,
			questionType: () => !getExercise().multipleSolutions ? 'radio' : 'checkbox',
			resultEvaluation(index) {
				const status = Progressor.getResultStatus(getExercise(), index, getEvaluationResults());
				if (status !== 0)
					return `has-${status > 0 ? 'success' : 'error'}`;
			},
			checkedStatus(index) {
				const result = Progressor.results.findOne();
				if (result && result.results && result.results[index] && result.results[index].checked)
					return 'checked';
			}
		});

	Template.multipleSolve.events(
		{
			'click #button-solution': (e, t) => t.$('.input-option').each((i, o) => $(o).prop('checked', _.contains(getExercise().solution, i))),
			'change .input-option': (e, t) => t.progress.activities++,
			'click #button-save-answer': (e, t) => Meteor.call('evaluateMultipleChoice', getExercise(), t.$('.input-option:checked').map((i, e) => parseInt($(e).val())).get(), Progressor.handleError((e, r) => t.evaluationResults.set(!e ? r : [])))
		});

})();
