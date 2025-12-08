import { calculateEquipmentAttributeBonus, calculateTownAttributeBonus } from './attribute-calculator.js';

/**
 * 스펙 계산기
 * dev_plan.md의 공식에 따라 각종 스펙을 계산합니다.
 */
export class SpecCalculator {
  /**
   * 공격력 계산
   * 공격력 = { [ (무기 위력 × (1 + 무기 위력 해방옵션%)) × 장비 속성 보정 ] + [ (힘 × (1 + 힘 해방옵션%)) ] } × 마을 속성 보정
   * 관통 적용: 기본 공격력 + (상대 방어력 × 방어력 관통 해방 옵션% / 100)
   */
  calculateAttack(input) {
    const weaponPower = parseFloat(input.weaponPower) || 0;
    const weaponPowerRelease = parseFloat(input.weaponPowerRelease) || 0;
    const strength = parseFloat(input.strength) || 0;
    const strengthRelease = parseFloat(input.strengthRelease) || 0;
    
    const equipmentBonus = calculateEquipmentAttributeBonus(
      input.weaponElement,
      input.characterElement
    );
    
    const townBonus = calculateTownAttributeBonus(
      input.characterElement,
      input.townElement
    );
    
    // 기본 위력 (해방 옵션, 속성 보정 적용 전)
    const baseWeaponPower = weaponPower;
    
    // 해방 위력 보너스 = 기본 위력 × 해방옵션% × 장비 속성 보정 × 마을 속성 보정
    const releaseBonus = baseWeaponPower * (weaponPowerRelease / 100) * equipmentBonus * townBonus;
    
    // 장비 속성 보너스 = 기본 위력 × (장비 속성 보정 - 1) × 마을 속성 보정
    const equipmentAttributeBonus = baseWeaponPower * (equipmentBonus - 1) * townBonus;
    
    // 해방 옵션 적용된 위력
    const weaponPowerWithRelease = baseWeaponPower + (baseWeaponPower * (weaponPowerRelease / 100));
    
    // 장비 속성 보정 적용된 위력
    const weaponPart = weaponPowerWithRelease * equipmentBonus;
    const statPart = strength * (1 + strengthRelease / 100);
    
    // 마을 속성 보정 적용 전
    const beforeTownBonus = weaponPart + statPart;
    
    // 마을 속성 보너스 = (장비 속성 보정 적용된 위력 + 스탯) × (마을 속성 보정 - 1)
    const townAttributeBonus = beforeTownBonus * (townBonus - 1);
    
    const baseAttack = beforeTownBonus * townBonus;
    
    // 해방 관통 보너스 계산
    const enemyDefense = parseFloat(input.enemyDefense) || 0;
    const defensePenetration = parseFloat(input.defensePenetration) || 0;
    const penetrationBonus = enemyDefense * (defensePenetration / 100);
    
    return {
      base: baseAttack,
      releaseBonus: releaseBonus, // 해방 위력 보너스
      equipmentAttributeBonus: equipmentAttributeBonus, // 장비 속성 보너스
      townAttributeBonus: townAttributeBonus, // 마을 속성 보너스
      penetrationBonus: penetrationBonus, // 해방 관통 보너스
      total: baseAttack + penetrationBonus
    };
  }

  /**
   * 마법공격력 계산
   * 마법공격력 = { [ (무기 위력 × (1 + 무기 위력 해방옵션%)) × 장비 속성 보정 ] + [ (지능 × (1 + 지능 해방옵션%)) ] } × 마을 속성 보정
   * 관통 적용: 기본 마법공격력 + (상대 마법방어력 × 마법방어력 관통 해방 옵션% / 100)
   */
  calculateMagicAttack(input) {
    const weaponPower = parseFloat(input.weaponPower) || 0;
    const weaponPowerRelease = parseFloat(input.weaponPowerRelease) || 0;
    const intelligence = parseFloat(input.intelligence) || 0;
    const intelligenceRelease = parseFloat(input.intelligenceRelease) || 0;
    
    const equipmentBonus = calculateEquipmentAttributeBonus(
      input.weaponElement,
      input.characterElement
    );
    
    const townBonus = calculateTownAttributeBonus(
      input.characterElement,
      input.townElement
    );
    
    // 기본 위력 (해방 옵션, 속성 보정 적용 전)
    const baseWeaponPower = weaponPower;
    
    // 해방 위력 보너스 = 기본 위력 × 해방옵션% × 장비 속성 보정 × 마을 속성 보정
    const releaseBonus = baseWeaponPower * (weaponPowerRelease / 100) * equipmentBonus * townBonus;
    
    // 장비 속성 보너스 = 기본 위력 × (장비 속성 보정 - 1) × 마을 속성 보정
    const equipmentAttributeBonus = baseWeaponPower * (equipmentBonus - 1) * townBonus;
    
    // 해방 옵션 적용된 위력
    const weaponPowerWithRelease = baseWeaponPower + (baseWeaponPower * (weaponPowerRelease / 100));
    
    // 장비 속성 보정 적용된 위력
    const weaponPart = weaponPowerWithRelease * equipmentBonus;
    const statPart = intelligence * (1 + intelligenceRelease / 100);
    
    // 마을 속성 보정 적용 전
    const beforeTownBonus = weaponPart + statPart;
    
    // 마을 속성 보너스 = (장비 속성 보정 적용된 위력 + 스탯) × (마을 속성 보정 - 1)
    const townAttributeBonus = beforeTownBonus * (townBonus - 1);
    
    const baseMagicAttack = beforeTownBonus * townBonus;
    
    // 해방 관통 보너스 계산
    const enemyMagicDefense = parseFloat(input.enemyMagicDefense) || 0;
    const magicDefensePenetration = parseFloat(input.magicDefensePenetration) || 0;
    const magicPenetrationBonus = enemyMagicDefense * (magicDefensePenetration / 100);
    
    return {
      base: baseMagicAttack,
      releaseBonus: releaseBonus, // 해방 위력 보너스
      equipmentAttributeBonus: equipmentAttributeBonus, // 장비 속성 보너스
      townAttributeBonus: townAttributeBonus, // 마을 속성 보너스
      penetrationBonus: magicPenetrationBonus, // 해방 관통 보너스
      total: baseMagicAttack + magicPenetrationBonus
    };
  }

  /**
   * 방어력 계산
   * 방어력 = { [ (방어구 위력 × (1 + 방어구 위력 해방옵션%)) × 장비 속성 보정 ] + [ (장신구 위력 × (1 + 장신구 위력 해방옵션%)) × 장비 속성 보정 ] + [ (생명 × (1 + 생명 해방옵션%)) ] } × 마을 속성 보정
   */
  calculateDefense(input) {
    const armorPower = parseFloat(input.armorPower) || 0;
    const armorPowerRelease = parseFloat(input.armorPowerRelease) || 0;
    const accessoryPower = parseFloat(input.accessoryPower) || 0;
    const accessoryPowerRelease = parseFloat(input.accessoryPowerRelease) || 0;
    const vitality = parseFloat(input.vitality) || 0;
    const vitalityRelease = parseFloat(input.vitalityRelease) || 0;
    
    const armorEquipmentBonus = calculateEquipmentAttributeBonus(
      input.armorElement,
      input.characterElement
    );
    
    const accessoryEquipmentBonus = calculateEquipmentAttributeBonus(
      input.accessoryElement,
      input.characterElement
    );
    
    const townBonus = calculateTownAttributeBonus(
      input.characterElement,
      input.townElement
    );
    
    // 방어구 계산
    const baseArmorPower = armorPower;
    const armorReleaseBonus = baseArmorPower * (armorPowerRelease / 100) * armorEquipmentBonus * townBonus;
    const armorEquipmentAttributeBonus = baseArmorPower * (armorEquipmentBonus - 1) * townBonus;
    const armorPowerWithRelease = baseArmorPower + (baseArmorPower * (armorPowerRelease / 100));
    const armorPart = armorPowerWithRelease * armorEquipmentBonus;
    
    // 장신구 계산
    const baseAccessoryPower = accessoryPower;
    const accessoryReleaseBonus = baseAccessoryPower * (accessoryPowerRelease / 100) * accessoryEquipmentBonus * townBonus;
    const accessoryEquipmentAttributeBonus = baseAccessoryPower * (accessoryEquipmentBonus - 1) * townBonus;
    const accessoryPowerWithRelease = baseAccessoryPower + (baseAccessoryPower * (accessoryPowerRelease / 100));
    const accessoryPart = accessoryPowerWithRelease * accessoryEquipmentBonus;
    
    // 스탯 부분
    const statPart = vitality * (1 + vitalityRelease / 100);
    
    // 마을 속성 보정 적용 전
    const beforeTownBonus = armorPart + accessoryPart + statPart;
    
    // 마을 속성 보너스
    const townAttributeBonus = beforeTownBonus * (townBonus - 1);
    
    const totalDefense = beforeTownBonus * townBonus;
    
    return {
      base: beforeTownBonus, // 표기공 (마을 속성 보정 적용 전)
      total: totalDefense,
      releaseBonus: armorReleaseBonus + accessoryReleaseBonus, // 해방 위력 보너스 (방어구 + 장신구)
      equipmentAttributeBonus: armorEquipmentAttributeBonus + accessoryEquipmentAttributeBonus, // 장비 속성 보너스 (방어구 + 장신구)
      townAttributeBonus: townAttributeBonus // 마을 속성 보너스
    };
  }

  /**
   * 마법방어력 계산
   * 마법방어력 = { [ (장신구 위력 × 4.5 × (1 + 장신구 위력 해방옵션%)) × 장비 속성 보정 ] + [ (정신 × (1 + 정신 해방옵션%)) ] } × 마을 속성 보정
   */
  calculateMagicDefense(input) {
    const accessoryPower = parseFloat(input.accessoryPower) || 0;
    const accessoryPowerRelease = parseFloat(input.accessoryPowerRelease) || 0;
    const spirit = parseFloat(input.spirit) || 0;
    const spiritRelease = parseFloat(input.spiritRelease) || 0;
    
    const accessoryEquipmentBonus = calculateEquipmentAttributeBonus(
      input.accessoryElement,
      input.characterElement
    );
    
    const townBonus = calculateTownAttributeBonus(
      input.characterElement,
      input.townElement
    );
    
    // 장신구 계산 (4.5배 적용)
    const baseAccessoryPower = accessoryPower * 4.5;
    const accessoryReleaseBonus = baseAccessoryPower * (accessoryPowerRelease / 100) * accessoryEquipmentBonus * townBonus;
    const accessoryEquipmentAttributeBonus = baseAccessoryPower * (accessoryEquipmentBonus - 1) * townBonus;
    const accessoryPowerWithRelease = baseAccessoryPower + (baseAccessoryPower * (accessoryPowerRelease / 100));
    const accessoryPart = accessoryPowerWithRelease * accessoryEquipmentBonus;
    
    // 스탯 부분
    const statPart = spirit * (1 + spiritRelease / 100);
    
    // 마을 속성 보정 적용 전
    const beforeTownBonus = accessoryPart + statPart;
    
    // 마을 속성 보너스
    const townAttributeBonus = beforeTownBonus * (townBonus - 1);
    
    const totalMagicDefense = beforeTownBonus * townBonus;
    
    return {
      base: beforeTownBonus, // 표기공 (마을 속성 보정 적용 전)
      total: totalMagicDefense,
      releaseBonus: accessoryReleaseBonus, // 해방 위력 보너스
      equipmentAttributeBonus: accessoryEquipmentAttributeBonus, // 장비 속성 보너스
      townAttributeBonus: townAttributeBonus // 마을 속성 보너스
    };
  }

  /**
   * 공격속도 계산
   * 공격속도 = (속도 × (1 + 속도 해방옵션%)) − 무기 무게 − 방어구 무게 − 장신구 무게
   */
  calculateAttackSpeed(input) {
    const speed = parseFloat(input.speed) || 0;
    const speedRelease = parseFloat(input.speedRelease) || 0;
    const weaponWeight = parseFloat(input.weaponWeight) || 0;
    const armorWeight = parseFloat(input.armorWeight) || 0;
    const accessoryWeight = parseFloat(input.accessoryWeight) || 0;
    
    return (speed * (1 + speedRelease / 100)) - weaponWeight - armorWeight - accessoryWeight;
  }

  /**
   * 회피치 계산
   * 회피치 = [ 지능 × (1 + 지능 해방옵션%) × 3.5 ] + [ 행운 × (1 + 행운 해방옵션%) × 2 ] + [ 공격속도 × 2 ]
   * 공격속도 = (속도 × (1 + 속도 해방옵션%)) − 무기 무게 − 방어구 무게 − 장신구 무게
   */
  calculateEvasion(input) {
    const intelligence = parseFloat(input.intelligence) || 0;
    const intelligenceRelease = parseFloat(input.intelligenceRelease) || 0;
    const luck = parseFloat(input.luck) || 0;
    const luckRelease = parseFloat(input.luckRelease) || 0;
    
    const attackSpeed = this.calculateAttackSpeed(input);
    
    const intelligencePart = intelligence * (1 + intelligenceRelease / 100) * 3.5;
    const luckPart = luck * (1 + luckRelease / 100) * 2;
    const speedPart = attackSpeed * 2;
    
    return intelligencePart + luckPart + speedPart;
  }

  /**
   * 적중치 계산
   * 적중치 = [ 정신 × (1 + 정신 해방옵션%) × 2.8 ] + [ 행운 × (1 + 행운 해방옵션%) × 1.6 ] + [ 공격속도 × 1.6 ]
   * 공격속도 = (속도 × (1 + 속도 해방옵션%)) − 무기 무게 − 방어구 무게 − 장신구 무게
   */
  calculateAccuracy(input) {
    const spirit = parseFloat(input.spirit) || 0;
    const spiritRelease = parseFloat(input.spiritRelease) || 0;
    const luck = parseFloat(input.luck) || 0;
    const luckRelease = parseFloat(input.luckRelease) || 0;
    
    const attackSpeed = this.calculateAttackSpeed(input);
    
    const spiritPart = spirit * (1 + spiritRelease / 100) * 2.8;
    const luckPart = luck * (1 + luckRelease / 100) * 1.6;
    const speedPart = attackSpeed * 1.6;
    
    return spiritPart + luckPart + speedPart;
  }

  /**
   * 치명타 확률 계산
   * 치명타 확률 = [ 행운 × (1 + 행운 해방옵션%) × 0.0535 ] + 0.45
   */
  calculateCriticalRate(input) {
    const luck = parseFloat(input.luck) || 0;
    const luckRelease = parseFloat(input.luckRelease) || 0;
    
    return (luck * (1 + luckRelease / 100) * 0.0535) + 0.45;
  }

  /**
   * 치명타 데미지(%) 계산
   * 치명타 데미지(%) = 103 + CEIL( ( 2.0 × [힘 × (1 + 힘 해방옵션%)] + 0.9 × [행운 × (1 + 행운 해방옵션%)] ) / 34 )
   */
  calculateCriticalDamage(input) {
    const strength = parseFloat(input.strength) || 0;
    const strengthRelease = parseFloat(input.strengthRelease) || 0;
    const luck = parseFloat(input.luck) || 0;
    const luckRelease = parseFloat(input.luckRelease) || 0;
    
    const strengthPart = 2.0 * (strength * (1 + strengthRelease / 100));
    const luckPart = 0.9 * (luck * (1 + luckRelease / 100));
    
    return 103 + Math.ceil((strengthPart + luckPart) / 34);
  }

  /**
   * 모든 스펙 계산
   */
  calculateAll(input) {
    const attackResult = this.calculateAttack(input);
    const magicAttackResult = this.calculateMagicAttack(input);
    const defenseResult = this.calculateDefense(input);
    const magicDefenseResult = this.calculateMagicDefense(input);
    
    return {
      attack: attackResult.total,
      attackBase: attackResult.base,
      attackReleaseBonus: attackResult.releaseBonus,
      attackEquipmentAttributeBonus: attackResult.equipmentAttributeBonus,
      attackTownAttributeBonus: attackResult.townAttributeBonus,
      attackPenetrationBonus: attackResult.penetrationBonus,
      magicAttack: magicAttackResult.total,
      magicAttackBase: magicAttackResult.base,
      magicAttackReleaseBonus: magicAttackResult.releaseBonus,
      magicAttackEquipmentAttributeBonus: magicAttackResult.equipmentAttributeBonus,
      magicAttackTownAttributeBonus: magicAttackResult.townAttributeBonus,
      magicAttackPenetrationBonus: magicAttackResult.penetrationBonus,
      defense: defenseResult.total,
      defenseBase: defenseResult.base,
      defenseReleaseBonus: defenseResult.releaseBonus,
      defenseEquipmentAttributeBonus: defenseResult.equipmentAttributeBonus,
      defenseTownAttributeBonus: defenseResult.townAttributeBonus,
      magicDefense: magicDefenseResult.total,
      magicDefenseBase: magicDefenseResult.base,
      magicDefenseReleaseBonus: magicDefenseResult.releaseBonus,
      magicDefenseEquipmentAttributeBonus: magicDefenseResult.equipmentAttributeBonus,
      magicDefenseTownAttributeBonus: magicDefenseResult.townAttributeBonus,
      attackSpeed: this.calculateAttackSpeed(input),
      evasion: this.calculateEvasion(input),
      accuracy: this.calculateAccuracy(input),
      criticalRate: this.calculateCriticalRate(input),
      criticalDamage: this.calculateCriticalDamage(input),
      recovery: null // 공식 알 수 없음
    };
  }
}

