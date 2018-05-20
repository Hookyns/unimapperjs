// Just declare this symbol as something... Used in lambda queries
declare const $: any;

/**
 * Allows you to interrupt default action
 */
declare interface IPreventableEvent {
	preventDefault();
}