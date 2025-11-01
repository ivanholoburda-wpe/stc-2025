# Анализ недостающих полей в существующих моделях

## 1. Модель BgpPeer

**Существующие поля:**
- peer_ip
- address_family
- remote_as
- state
- up_down_time
- msg_rcvd
- msg_sent

**Недостающие поля из парсеров:**

### display_bgp_global_peer_block, display_bgp_vpnv4_peer_block, display_bgp_vpnv6_peer_block, display_bgp_evpn_peer_block:
- `version` (integer) - версия BGP (4)
- `out_queue` (integer) - размер исходящей очереди сообщений
- `prefixes_received` (integer) - количество полученных префиксов
- `vpn_instance` (string, nullable) - имя VPN instance для VPNv4/VPNv6 peers

**Рекомендация:** Добавить поля version, out_queue, prefixes_received, vpn_instance

---

## 2. Модель IpRoute

**Существующие поля:**
- destination_mask
- protocol
- preference
- cost
- flags
- next_hop
- interface

**Недостающие поля из BGP routing tables:**

### display_bgp_vpnv4_routing_table_block, display_bgp_vpnv6_routing_table_block, display_bgp_evpn_routing_table_block:
- `status` (string) - статус маршрута (например, "*>", "*>i")
- `network` (string, nullable) - сеть отдельно от маски (для BGP это может быть null)
- `prefix_len` (integer, nullable) - длина префикса (для IPv6)
- `loc_prf` (integer, nullable) - Local Preference
- `med` (string/integer, nullable) - MED (Multi-Exit Discriminator)
- `pref_val` (integer, nullable) - Preference Value
- `path_ogn` (string, nullable) - Path Origin (например, "?", "i", "e")
- `label` (integer, nullable) - MPLS Label (для VPN routes)
- `route_distinguisher` (string, nullable) - Route Distinguisher для VPN routes
- `vpn_instance` (string, nullable) - имя VPN instance

**Рекомендация:** Добавить поля для BGP-специфичных данных. Возможно, стоит создать отдельную модель BgpRoute или расширить IpRoute.

---

## 3. Модель Interface

**Существующие поля:**
- name
- phy_status
- protocol_status
- description
- ip_address
- mtu

**Недостающие поля из display_interface_brief_block:**
- `in_utilization` (string) - входящая утилизация (например, "0.01%", "--")
- `out_utilization` (string) - исходящая утилизация
- `in_errors` (integer) - количество входящих ошибок
- `out_errors` (integer) - количество исходящих ошибок

**Рекомендация:** Добавить поля in_utilization, out_utilization, in_errors, out_errors

---

## 4. Новые модели (не существуют)

### HealthComponent (для display_health_block)
**ВАЖНО:** Можно использовать существующую модель **HardwareComponent**!
- HardwareComponent уже имеет: device, snapshot, slot, type
- Поле `details` (JSON) уже используется для хранения дополнительных данных (см. IpuDetailIngestor, PowerDetailIngestor)
- Health данные можно сохранить в `details` JSON поле:
  ```json
  {
    "cpu_usage_percent": 13,
    "memory_usage_percent": 26,
    "memory_used_mb": 3935,
    "memory_total_mb": 14798,
    "component": "IPU(Master)"
  }
  ```
- ИЛИ можно добавить отдельные поля в HardwareComponent:
  - cpu_usage_percent (integer, nullable)
  - memory_usage_percent (integer, nullable)
  - memory_used_mb (integer, nullable)
  - memory_total_mb (integer, nullable)
  
**Рекомендация:** Использовать существующую модель HardwareComponent с расширением details JSON или добавлением отдельных полей.

---

### EthTrunk (для display_eth_trunk_detail_block)
**АНАЛИЗ:** Trunk - это агрегация интерфейсов, но это отдельная сущность, не свойство Interface.

**Нужна отдельная модель**, так как:
- Trunk имеет свой ID (trunk_id/lag_id)
- Trunk имеет множество портов (actor_ports, partner_ports, normal_ports) - это связи Many-to-Many
- Trunk имеет собственную конфигурацию (mode_type, working_mode, local_info)
- Interface не имеет связи с trunk (нет поля trunk_id)

**Структура модели:**
- device (FK)
- snapshot (FK)
- trunk_id (integer) - LAG ID
- mode_type (string, nullable) - "LACP", "Manual", null
- working_mode (string) - из local_info
- operating_status (string)
- number_of_up_ports (integer)
- local_info (JSON) - для сохранения всех деталей local_info
- ports_info (JSON) - для actor_ports, partner_ports, normal_ports

**Альтернатива:** Можно было бы добавить trunk_id в Interface, но один порт может быть в одном trunk, а информация о trunk (mode, status, ports) - это отдельная сущность.

**Рекомендация:** Создать отдельную модель EthTrunk.

---

### Vlan (для display_vlan_block)
**АНАЛИЗ:** VLAN - это отдельная сущность, не свойство интерфейса.

**Нужна отдельная модель**, так как:
- VLAN имеет свой ID (vid)
- VLAN имеет свойства (status, property, mac_learn, statistics, description)
- ARPRecord имеет поле vlan, но это только для ARP записей
- Interface не имеет информации о VLAN напрямую

**Структура модели:**
- device (FK)
- snapshot (FK)
- vid (integer) - VLAN ID
- status (string)
- property (string)
- mac_learn (string)
- statistics (string)
- description (string)

**Рекомендация:** Создать отдельную модель Vlan.

---

### PortVlan (для display_port_vlan_block)
**АНАЛИЗ:** PortVlan - это связь между портом (интерфейсом) и VLAN.

**Нужна отдельная модель** для нормализации, так как:
- Один порт может иметь несколько VLAN (vlan_list)
- Один VLAN может быть на нескольких портах
- Это Many-to-Many связь между Interface и Vlan
- Interface не имеет поля для VLAN информации

**Структура модели:**
- device (FK)
- snapshot (FK)
- interface (FK, nullable) - связь с Interface по имени порта
- port_name (string) - имя порта
- link_type (string) - "Access", "Trunk", etc.
- pvid (integer) - Primary VLAN ID
- vlan_list (string) - список VLAN через запятую или как строка

**Альтернатива:** Можно было бы добавить pvid и vlan_list в Interface, но это нарушает нормализацию (один порт может иметь несколько VLAN в списке).

**Рекомендация:** Создать отдельную модель PortVlan.

---

### VxlanTunnel (для display_vxlan_tunnel_block)
**АНАЛИЗ:** VXLAN Tunnel - это отдельная сущность от VPN Instance.

**Нужна отдельная модель**, так как:
- VpnInstance существует, но это для VPN instances (name, rd, address_family)
- VXLAN Tunnel - это конкретный туннель с source, destination, state, type
- В одном VPN instance может быть несколько туннелей (total_tunnels)
- MplsL2vc имеет tunnel_id, но это для MPLS туннелей, не VXLAN

**Структура модели:**
- device (FK)
- snapshot (FK)
- vpn_instance (string) - имя VPN instance
- tunnel_id (bigint/integer)
- source (string) - IP адрес источника
- destination (string) - IP адрес назначения
- state (string) - "up", "down"
- type (string) - "dynamic", "static"
- uptime (string) - время работы

**Альтернатива:** Можно было бы хранить tunnels в VpnInstance.details JSON, но туннелей может быть много, и это затруднит запросы.

**Рекомендация:** Создать отдельную модель VxlanTunnel.

---

## 5. Дополнительные модели для статистики

### IpRouteStatistics (для display_ip_routing_table_statistics_block)
**АНАЛИЗ:** Статистика маршрутизации - это агрегированная информация.

**Варианты:**
1. Создать отдельную модель для каждой записи протокола
2. Хранить в Device.details JSON (если статистика нужна только для устройства)
3. Не сохранять вообще (если нужна только для анализа)

**Структура (если создавать модель):**
- device (FK)
- snapshot (FK)
- summary_prefixes (integer, nullable)
- protocol (string)
- total_routes (integer)
- active_routes (integer)
- added_routes (integer)
- deleted_routes (integer)
- freed_routes (integer)

**Рекомендация:** Создать модель только если статистика критически важна для аналитики.

---

## Итоговые рекомендации:

1. **Расширить существующие модели:**
   - **BgpPeer**: добавить version, out_queue, prefixes_received, vpn_instance
   - **IpRoute**: добавить status, network, prefix_len, loc_prf, med, pref_val, path_ogn, label, route_distinguisher, vpn_instance
   - **Interface**: добавить in_utilization, out_utilization, in_errors, out_errors
   - **HardwareComponent**: использовать существующую модель для display_health_block (хранить в details JSON или добавить поля cpu_usage_percent, memory_usage_percent, memory_used_mb, memory_total_mb)

2. **Создать новые модели:**
   - ~~HealthComponent~~ - **НЕ НУЖНА, использовать HardwareComponent**
   - **EthTrunk** - **НУЖНА** (отдельная сущность, агрегация интерфейсов)
   - **Vlan** - **НУЖНА** (отдельная сущность)
   - **PortVlan** - **НУЖНА** (связь Many-to-Many между Interface и Vlan)
   - **VxlanTunnel** - **НУЖНА** (отдельная сущность, не VPN instance)
   - **IpRouteStatistics** - опционально (только если нужна для аналитики)

3. **Альтернативный подход:**
   - Использовать JSON поля для хранения сложных структур:
     - HardwareComponent.details - для health данных ✅
     - EthTrunk.local_info и ports_info в JSON ✅
     - VpnInstance.details - НЕ рекомендуется для tunnels (затрудняет запросы)

## Выводы по проверке существующих моделей:

✅ **HealthComponent** - можно использовать HardwareComponent  
❌ **EthTrunk** - нужна отдельная модель (агрегация интерфейсов)  
❌ **Vlan** - нужна отдельная модель (отдельная сущность)  
❌ **PortVlan** - нужна отдельная модель (Many-to-Many связь)  
❌ **VxlanTunnel** - нужна отдельная модель (отдельная от VpnInstance)  
⚠️ **IpRouteStatistics** - опционально
