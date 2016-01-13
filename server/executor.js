(function () {
	'use strict';

	var executorConnection = null;

	function getExecutorClient() {

		if (executorConnection === null)
			executorConnection = thrift.createConnection('localhost', 9090);
		return thrift.createClient(Executor, executorConnection);
	}

	Meteor.methods(
		{
			getExecutorTypes() {
				return [
					{ _id: ttypes.TypeString, label: ttypes.TypeString, parameterCount: 0 },
					{ _id: ttypes.TypeCharacter, label: ttypes.TypeCharacter, parameterCount: 0 },
					{ _id: ttypes.TypeBoolean, label: ttypes.TypeBoolean, parameterCount: 0 },
					{ _id: ttypes.TypeByte, label: ttypes.TypeByte, parameterCount: 0 },
					{ _id: ttypes.TypeShort, label: ttypes.TypeShort, parameterCount: 0 },
					{ _id: ttypes.TypeInteger, label: ttypes.TypeInteger, parameterCount: 0 },
					{ _id: ttypes.TypeLong, label: ttypes.TypeLong, parameterCount: 0 },
					{ _id: ttypes.TypeSingle, label: ttypes.TypeSingle, parameterCount: 0 },
					{ _id: ttypes.TypeDouble, label: ttypes.TypeDouble, parameterCount: 0 },
					{ _id: ttypes.TypeDecimal, label: ttypes.TypeDecimal, parameterCount: 0 },
					{ _id: ttypes.TypeContainerArray, label: `${ttypes.TypeContainerArray}<T>`, parameterCount: 1 },
					{ _id: ttypes.TypeContainerList, label: `${ttypes.TypeContainerList}<T>`, parameterCount: 1 },
					{ _id: ttypes.TypeContainerSet, label: `${ttypes.TypeContainerSet}<T>`, parameterCount: 1 },
					{ _id: ttypes.TypeContainerMap, label: `${ttypes.TypeContainerMap}<K, V>`, parameterCount: 2 }
				];
			},
			getBlacklist(language) {
				check(language, String);

				var client = getExecutorClient();
				return Meteor.wrapAsync(client.getBlacklist, client)(language);
			},
			getFragment(language, exercise) {
				check(language, String);
				check(exercise, Match.ObjectIncluding(
					{
						functions: [
							Match.ObjectIncluding(
								{
									name: String,
									inputNames: [String],
									inputTypes: [String],
									outputNames: [String],
									outputTypes: [String]
								})
						]
					}));

				var functions = _.map(exercise.functions, (fun) => new ttypes.FunctionSignature(fun));

				var client = getExecutorClient();
				return Meteor.wrapAsync(client.getFragment, client)(language, functions);
			},
			execute(language, exercise, fragment) {
				check(language, String);
				check(exercise, Match.ObjectIncluding(
					{
						functions: [
							Match.ObjectIncluding(
								{
									name: String,
									inputNames: [String],
									inputTypes: [String],
									outputNames: [String],
									outputTypes: [String]
								})],
						testCases: [
							Match.ObjectIncluding(
								{
									functionName: String,
									inputValues: [String],
									expectedOutputValues: [String]
								})
						]
					}));
				check(fragment, String);

				var functions = _.map(exercise.functions, (fun) => new ttypes.FunctionSignature(fun)),
					testCases = _.map(exercise.testCases, (cas) => new ttypes.TestCase(cas));

				var client = getExecutorClient();
				return Meteor.wrapAsync(client.execute, client)(language, fragment, functions, testCases);
			}
		});

})();
