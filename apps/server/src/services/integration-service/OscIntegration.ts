import { ArgumentType, Client, Message } from 'node-osc';
import { LogOrigin, MaybeNumber, MaybeString, OSCSettings, OscSubscription } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { parseTemplateNested } from './integrationUtils.js';
import { logger } from '../../classes/Logger.js';
import { OscServer } from '../../adapters/OscAdapter.js';
import { stringToOSCArgs } from '../../utils/oscArgParser.js';

/**
 * @description Class contains logic towards outgoing OSC communications
 * @class
 */
export class OscIntegration implements IIntegration<OscSubscription, OSCSettings> {
  protected oscClient: null | Client;
  protected oscServer: OscServer | null = null;

  subscriptions: OscSubscription[];
  targetIP: MaybeString;
  portOut: MaybeNumber;
  portIn: MaybeNumber;
  enabledOut: boolean;
  enabledIn: boolean;

  constructor() {
    this.oscClient = null;
    this.subscriptions = [];
    this.targetIP = null;
    this.portOut = null;
    this.portIn = null;
    this.enabledOut = false;
    this.enabledIn = false;
  }

  /**
   * Initializes oscClient
   */
  init(config: OSCSettings) {
    const { targetIP, portOut, subscriptions, enabledOut, enabledIn, portIn } = config;

    this.initTX(enabledOut, targetIP, portOut, subscriptions);
    this.initRX(enabledIn, portIn);
    // return `OSC integration client connected to ${targetIP}:${portOut}`;
  }

  private initSubscriptions(subscriptions: OscSubscription[]) {
    this.subscriptions = subscriptions;
  }

  dispatch(action: TimerLifeCycleKey, state?: object) {
    // noop
    if (!this.oscClient || !this.enabledOut) {
      return;
    }

    for (let i = 0; i < this.subscriptions.length; i++) {
      const { cycle, address, payload, enabled } = this.subscriptions[i];
      if (cycle !== action || !enabled || !address) {
        continue;
      }
      const parsedAddress = parseTemplateNested(address, state || {});
      const parsedPayload = payload ? parseTemplateNested(payload, state || {}) : undefined;
      const parsedArguments = stringToOSCArgs(parsedPayload);

      try {
        this.emit(parsedAddress, parsedArguments);
      } catch (error) {
        logger.error(LogOrigin.Tx, `OSC Integration: ${error}`);
      }
    }
  }

  emit(address: string, args: ArgumentType[]) {
    if (!this.oscClient) {
      return;
    }

    //TODO: Look into using bundles
    const message = new Message(address);
    message.append(args);

    this.oscClient.send(message);
  }

  private initTX(enabledOut: boolean, targetIP: string, portOut: number, subscriptions: OscSubscription[]) {
    this.initSubscriptions(subscriptions);

    if (!enabledOut) {
      this.targetIP = targetIP;
      this.portOut = portOut;
      this.enabledOut = enabledOut;
      this.shutdownTX();
      return;
    }

    if (this.oscClient && targetIP === this.targetIP && portOut === this.portOut) {
      // nothing changed that would mean we need a new client
      return;
    }

    this.targetIP = targetIP;
    this.portOut = portOut;
    this.enabledOut = enabledOut;

    try {
      this.oscClient = new Client(targetIP, portOut);
      logger.info(LogOrigin.Tx, `Starting OSC Clint on port: ${portOut}`);
    } catch (error) {
      this.oscClient = null;
      throw new Error(`Failed initialising OSC client: ${error}`);
    }
  }

  private initRX(enabledIn: boolean, portIn: number) {
    if (!enabledIn) {
      this.shutdownRX();
      return;
    }

    // Start OSC Server
    logger.info(LogOrigin.Rx, `Starting OSC Server on port: ${portIn}`);
    this.oscServer = new OscServer(portIn);
  }

  shutdown() {
    this.shutdownTX();
    this.shutdownRX();
  }

  private shutdownTX() {
    if (this.oscClient) {
      logger.info(LogOrigin.Tx, 'Shutting down OSC integration');
      this.oscClient?.close();
      this.oscClient = null;
    }
  }

  private shutdownRX() {
    if (this.oscServer) {
      logger.info(LogOrigin.Rx, 'Shutting down OSC integration');
      this.oscServer?.shutdown();
      this.oscServer = null;
    }
  }
}

export const oscIntegration = new OscIntegration();
