const BaseParser = require('../core/BaseParser');

class DisplayBfdSessionAllParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_bfd_session_all_block';

    this.rules = [
      {
        name: 'data_row',
        regex: /^\s*(?<Local>\d+)\s+(?<Remote>\d+)\s+(?<PeerIpAddr>[\d\.\*]+)\s+(?<State>\S+)\s+(?<Type>\S+)\s+(?<InterfaceName>\S+)\s*$/,
        handler: (match) => {
          this.data.sessions.push({
            local_discriminator: parseInt(match.groups.Local, 10),
            remote_discriminator: parseInt(match.groups.Remote, 10),
            peer_ip_address: match.groups.PeerIpAddr,
            state: match.groups.State,
            type: match.groups.Type,
            interface_name: match.groups.InterfaceName,
          });
        }
      },
      {
        name: 'ignore_lines',
        regex: /^(?:Local\s+Remote|---|-- -|\(w\):|\(\*\):)/,
        handler: () => {
        }
      }
    ];
  }

  isEntryPoint(line) {
    return /Local\s+Remote\s+PeerIpAddr/.test(line);
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      sessions: [],
    };
  }
}

module.exports = DisplayBfdSessionAllParser;