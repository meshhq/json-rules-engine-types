// Type definitions for json-rules-engine 2.3
// Project: https://github.com/cachecontrol/json-rules-engine
// Definitions by: Mesh Studio <https://github.com/meshhq>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'json-rules-engine' {

	import { EventEmitter } from 'events'

	// Common Types
	export type FactMap = Map<string, Fact>
	export type GeneralMap = { [key: string]: any }

	// Common Interfaces
	export interface EngineEvent {
		type: string
		params?: any
	}

	export interface EngineOptions {
		allowUndefinedFacts: boolean
	}

	export interface FactOptions {
		cache: boolean,
		priority: number
	}

	export interface RuleFields {
		conditions: ConditionFields,
		event: EngineEvent,
		priority?: number | string
	}

	export interface BaseCondition extends Prioritizable {
		value: any
		fact: string
		operator: string
		factResult?: any
		result?: boolean
		params?: object
		path?: string
		any?: BaseCondition[]
		all?: BaseCondition[]
	}

	export interface ConditionFields extends Prioritizable {
		all?: (ConditionFields | BaseCondition)[]
		any?: (ConditionFields | BaseCondition)[]
	}

	export interface Prioritizable {
		priority?: number | string
	}

	export interface RuleResult {
		conditions: BaseCondition
		event?: EngineEvent
		priority?: string | number | null
		result: boolean
	}

	export type FactValueOrMethod<T> = T | ((params: T, almanac: Almanac) => Promise<any>)
	export type FactMethod<T> = (params: T, almanac: Almanac) => Promise<any>
	export type OperatorEvalMethod<T, U> = (factValue: T, jsonValue: U) => boolean
	export type FactValueValidator<T> = (factValue: T) => boolean

	export class Engine extends EventEmitter {
		/**
		 * Returns a new Engine instance
		 * @param   {Object[]} rules - array of rules to initialize with
		 * @param   {Object} options - options to initialize the Engine with
		 * @param   {boolean} options.allowUndefinedFacts - By default, when a running engine encounters an undefined fact, an exception is thrown.
		 *          Turning this option on will cause the engine to treat undefined facts as falsey conditions. (default: false)
		 */
		constructor(rules?: Rule[], options?: EngineOptions)

		/**
		 * Add a fact definition to the engine.  Facts are called by rules as they are evaluated.
		 * @param   {string} id - Fact identifier
		 * @param   {primitive|function} valueOrMethod - constant primitive, or method to be called when computing the fact value for a given rule
		 * @param   {Object} options - options to initialize the fact with. used when "id" is not a Fact instance
		 * @returns {Object} The Engine
		 */
		addFact<T>(id: string, valueOrMethod?: FactValueOrMethod<T>, options?: FactOptions): Engine;

		/**
		 * Add a custom operator definition
		 * @param   {string} operatorName - operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc
		 * @param   {function(factValue, jsonValue)} cb - the method to execute when the operator is encountered.
		 */
		addOperator<T, U>(operatorName: string, cb?: OperatorEvalMethod<T, U>): void;

		/**
		 * Add a rule definition to the engine
		 * @param   {object|Rule} properties - rule definition.  can be JSON representation, or instance of Rule
		 * @param   {integer} properties.priority (>1) - higher runs sooner.
		 * @param   {Object} properties.event - event to fire when rule evaluates as successful
		 * @param   {string} properties.event.type - name of event to emit
		 * @param   {string} properties.event.params - parameters to pass to the event listener
		 * @param   {Object} properties.conditions - conditions to evaluate when processing this rule
		 * @returns {Object} The Engine
		 */
		addRule(ruleOrProperties: Rule | RuleFields): Engine;

		/**
		 * Runs an array of rules.
		 * @param   {Rule[]} ruleArray - array of rules to be evaluated
		 * @param   {Object} almanac
		 * @return  {Promise} Resolves when all rules have been evaluated.
		 */
		evaluateRules(ruleArray: any, almanac: Almanac): Promise<void>;

		/**
		 * Returns a Fact by the given factId
		 * @param   {string} factId - fact identifier
		 * @return  {Fact} fact instance, or undefined if no such fact exists
		 */
		getFact(factId: string): Fact | undefined;

		/**
		 * Iterates over the engine rules, organizing them by highest -> lowest priority
		 * @return  {Rule[][]} two dimensional array of Rules.
		 *          Each outer array element represents a single priority(integer).  Inner array is
		 *          all rules with that priority.
		 */
		prioritizeRules(): Rule[][];

		/**
		 * Add a Fact definition to the engine. Facts are called by Rules as they are evaluated.
		 * @param   {Object|string} factOrId - Fact identifier or instance of Fact
		 * @return  {boolean} Whether or not the Fact was removed.
		 */
		removeFact(factOrId: Fact | string): boolean;

		/**
		 * Removes a custom Operator definition
		 * @param   {Object|string} operatorOrName - Operator identifier within the condition; i.e. instead of 'equals', 'greaterThan', etc. or instance of Operator
		 * @return  {boolean} Whether or not the Operator was removed
		 */
		removeOperator(operatorOrName: Operator | string): boolean;

		/**
		 * Remove a rule from the engine
		 * @param   {Object} rule - Rule definition. Must be a instance of Rule.
		 * @return  {boolean} Whether or not the Rule was removed
		 */
		removeRule(rule: Rule): boolean;

		/**
		 * Runs the rules engine
		 * @param  {Object} runtimeFacts - fact values known at runtime
		 * @return {Promise} resolves when the engine has completed running
		 */
		run(runtimeFacts: GeneralMap): Promise<EngineEvent>;

		/**
		 * Stops the rules engine from running the next priority set of Rules.  All remaining rules will be resolved as undefined,
		 * and no further events emitted.  Since rules of the same priority are evaluated in parallel(not series), other rules of
		 * the same priority may still emit events, even though the engine is in a "finished" state.
		 * @return  {Object} The Engine
		 */
		stop(): Engine;

	}

	export class Fact {
		/**
		 * Returns a new Fact instance
		 * @param   {string} id - Fact unique identifer
		 * @param   {primitive|function} valueOrMethod - constant primitive, or method to call when computing the Fact's value
		 * @param   {object} options
		 * @param   {boolean} options.cache - Sets whether the engine should cache the result of this fact.
		 *			Cache key is based on the factId and 'params' passed to it. Default: true
		 * @param   {number} options.priority - Sets when the fact should run in relation to other facts and conditions.
		 *			The higher the priority value, the sooner the fact will run. Default: 1
		 * @return  {Fact}
		 */
		constructor(id: string, valueOrMethod: FactValueOrMethod<any>, options?: FactOptions);

		/**
		 * Return the Fact value, based on provided parameters. Returns immediately if the
		 * Fact was set with a constant value. Returns with a Promise otherwise.
		 * @param   {object} params
		 * @param   {Almanac} almanac
		 * @return  {any} calculation method results
		 */
		calculate<T>(params?: any, almanac?: Almanac): T;

		/**
		 * Default properties to use when caching a fact
		 * Assumes every fact is a pure function, whose computed value will only
		 * change when input params are modified
		 * @param   {string} id - fact unique identifer
		 * @param   {object} params - parameters passed to Fact calculation method
		 * @return  {object} id + params
		 */
		defaultCacheKeys(id: string, params: any): { params: any, id: string };

		/**
		 * Generates the Fact's cache key(MD5 string)
		 * Returns nothing if the Fact's caching has been disabled
		 * @param   {object} params - parameters that would be passed to the computation method
		 * @return  {string} cache key
		 */
		getCacheKey(params: any): string;

		/**
		 * Whether or not the Fact is constant or not
		 * @return  {boolean}
		 */
		isConstant(): boolean;

		/**
		 * Whether or not the Fact is dynamic or not
		 * @return  {boolean}
		 */
		isDynamic(): boolean;

		static CONSTANT: string;

		static DYNAMIC: string;


		/**
		 * Return a cache key (MD5 string) based on parameters
		 * @param  {object} obj - properties to generate a hash key from
		 * @return {string} MD5 string based on the hash'd object
		 */
		static hashFromObject(obj: any): string;

	}

	export class Operator {
		/**
		 * Constructor
		 * @param   {string} name - operator identifier
		 * @param   {function(factValue, jsonValue)} callback - operator evaluation method
		 * @param   {function} [factValueValidator] - optional validator for asserting the data type of the fact
		 * @returns {Operator} - instance
		 */
		constructor(name: string, cb: OperatorEvalMethod<any, any>, factValueValidator?: FactValueValidator<any>);

		/**
		 * Takes the fact result and compares it to the condition 'value', using the callback
		 * @param   {mixed} factValue - fact result
		 * @param   {mixed} jsonValue - "value" property of the condition
		 * @returns {Boolean} - whether the values pass the operator test
		 */
		evaluate<T, U>(factValue: T, jsonValue: U): boolean;

	}

	export class Rule extends EventEmitter {
		/**
		 * returns a new Rule instance
		 * @param   {object,string} options - Options or json string that can be parsed into options
		 * @param   {Object} options.conditions - Conditions to evaluate when processing this rule
		 * @param   {Object} options.event - Sets the .on('success') and on('failure') event argument emitted whenever the rule passes.
		 *          Event objects must have a type property, and an optional params property.
		 * @param   {string} options.event.type - Name of event to emit
		 * @param   {string} options.event.params - Parameters to pass to the event listener
		 * @param   {integer} options.priority - Dictates when rule should be run, relative to other rules. 
		 *          Higher priority rules are run before lower priority rules. Rules with the same priority are run in parallel. 
		 *          Priority must be a positive, non-zero integer. Default: 1
		 * @param   {function} options.onSuccess - Registers callback with the rule's on('success') listener. The rule's event property and the current Almanac are passed as arguments.
		 * @param   {function} options.onFailure - Registers callback with the rule's on('failure') listener. The rule's event property and the current Almanac are passed as arguments.
		 * @return  {Rule} instance
		 */
		constructor(options: RuleFields | string);

		/**
		 * Evaluates the rule, starting with the root boolean operator and recursing down
		 * All evaluation is done within the context of an almanac
		 * @return {Promise(RuleResult)} rule evaluation result
		 */
		evaluate(almanac: Almanac): Promise<RuleResult>;

		/**
		 * Prioritizes an array of conditions based on "priority"
		 * When no explicit priority is provided on the condition itself, the condition's priority is determine by its fact
		 * @param   {Condition[]} conditions
		 * @return  {Condition[][]} prioritized two-dimensional array of conditions
		 *          Each outer array element represents a single priority(integer).
		 *          Inner array is all conditions with that priority.
		 */
		prioritizeConditions(conditions: BaseCondition[]): BaseCondition[][];

		/**
		 * Sets the conditions to run when evaluating the rule.
		 * @param   {object} conditions - conditions, root element must be a boolean operator
		 * @return  {Rule} The Rule
		 */
		setConditions(conditions: ConditionFields): Rule;

		/**
		 * Sets the Engine to run the Rules under
		 * @param   {object} engine
		 * @returns {Rule} The Rule
		 */
		setEngine(engine: Engine): Rule;

		/**
		 * Sets the event to emit when the conditions evaluate truthy
		 * @param   {object} event - event to emit
		 * @param   {string} event.type - event name to emit on
		 * @param   {string} event.params - parameters to emit as the argument of the event emission
		 * @returns {Rule} The Rule
		 */
		setEvent(event: EngineEvent): Rule;

		/**
		 * Sets the priority of the rule
		 * @param   {integer} priority (>=1) - increasing the priority causes the rule to be run prior to other rules
		 * @returns {Rule} The Rule
		 */
		setPriority(priority: number): Rule;

		/**
		 * Returns the fields of this Rule
		 * @param {boolean} stringify - whether or not to stringify the result
		 * @returns {string|Object} An object of the Rule's fields or the string representation
		 */
		toJSON(stringify?: boolean): string | RuleFields;

	}

	export class Almanac {
		constructor(factMap: FactMap, runtimeFacts: { [key: string]: any });

		/**
		 * Adds a constant fact during runtime.  Can be used mid-run() to add additional information
		 * @param {String} fact - fact identifier
		 * @param {Mixed} value - constant value of the fact
		 */
		addRuntimeFact<T>(factId: string, value: T): Promise<void>;

		/**
		 * Returns the value of a fact, based on the given parameters.  Utilizes the 'almanac' maintained
		 * by the engine, which cache's fact computations based on parameters provided
		 * @param  {string} factId - fact identifier
		 * @param  {Object} params - parameters to feed into the fact. By default, these will also be used to compute the cache key
		 * @param  {String} path - object
		 * @return {Promise} a promise which will resolve with the fact computation.
		 */
		factValue(factId: string, params?: any, path?: string): Promise<any>;
	}
}
