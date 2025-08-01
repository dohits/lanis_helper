// 서브메뉴 스타일 관리 클래스 - 모든 스타일을 인라인으로 관리
class SubMenuStyles {
  constructor() {
    // 상수 정의
    this.CONSTANTS = {
      COLORS: {
        PRIMARY: '#1f2937',
        WHITE: 'white',
        GREEN: {
          LIGHT: '#10b981',
          DARK: '#059669'
        },
        RED: {
          LIGHT: '#ef4444',
          DARK: '#dc2626'
        },
        PURPLE: {
          LIGHT: '#667eea',
          DARK: '#764ba2'
        }
      },
      ICONS: {
        TOGGLE_ON: '✅',
        TOGGLE_OFF: '❌'
      },
      TEXT: {
        TOGGLE_ON: ' (켜짐)',
        TOGGLE_OFF: ' (꺼짐)'
      },
      DIMENSIONS: {
        WIDTH: '160px',
        HEIGHT: '44px',
        BORDER_RADIUS: '14px',
        FONT_SIZE: '14px',
        FONT_WEIGHT: '500',
        GAP: '8px',
        PADDING: '8px 12px',
        MIN_WIDTH: '120px'
      }
    };

    // 공통 스타일 속성
    this.commonStyles = {
      width: this.CONSTANTS.DIMENSIONS.WIDTH,
      height: this.CONSTANTS.DIMENSIONS.HEIGHT,
      borderRadius: this.CONSTANTS.DIMENSIONS.BORDER_RADIUS,
      cursor: 'pointer',
      fontSize: this.CONSTANTS.DIMENSIONS.FONT_SIZE,
      fontWeight: this.CONSTANTS.DIMENSIONS.FONT_WEIGHT,
      gap: this.CONSTANTS.DIMENSIONS.GAP,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(15px)',
      position: 'relative',
      overflow: 'hidden'
    };

    // 기본 스타일 (공통 + 기본 특성)
    this.baseStyles = {
      ...this.commonStyles,
      border: '1px solid rgba(255, 255, 255, 0.4)',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0.75) 100%)',
      color: this.CONSTANTS.COLORS.PRIMARY,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    };

    // 토글 버튼 기본 스타일 (공통 + 토글 특성)
    this.toggleBaseStyles = {
      ...this.commonStyles,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: this.CONSTANTS.DIMENSIONS.PADDING,
      minWidth: this.CONSTANTS.DIMENSIONS.MIN_WIDTH,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    // 스타일 팩토리 메서드들
    this.createGradientStyle = (startColor, endColor, borderColor, shadowColor) => ({
      ...this.baseStyles,
      fontWeight: 'bold',
      background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
      color: this.CONSTANTS.COLORS.WHITE,
      border: `1px solid ${borderColor}`,
      boxShadow: `0 4px 20px ${shadowColor}, 0 2px 10px ${shadowColor.replace('0.3', '0.2')}, inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 1px ${shadowColor.replace('0.3', '0.2')}`
    });

    this.createToggleStyle = (isEnabled) => {
      const colors = isEnabled ? this.CONSTANTS.COLORS.GREEN : this.CONSTANTS.COLORS.RED;
      const icon = isEnabled ? this.CONSTANTS.ICONS.TOGGLE_ON : this.CONSTANTS.ICONS.TOGGLE_OFF;
      const textSuffix = isEnabled ? this.CONSTANTS.TEXT.TOGGLE_ON : this.CONSTANTS.TEXT.TOGGLE_OFF;
      
      return {
        className: 'main-menu-item sub-menu-item toggle-button',
        inlineStyles: {
          ...this.toggleBaseStyles,
          border: `1px solid ${colors.LIGHT}`,
          background: `linear-gradient(135deg, ${colors.LIGHT}, ${colors.DARK})`,
          color: this.CONSTANTS.COLORS.WHITE,
          boxShadow: `0 4px 16px ${colors.LIGHT}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        },
        icon,
        titleSuffix: textSuffix
      };
    };

    // 통합된 스타일 시스템
    this.styles = {
      default: {
        className: 'main-menu-item sub-menu-item',
        inlineStyles: { ...this.baseStyles }
      },
      
      purpleGradient: {
        className: 'main-menu-item sub-menu-item',
        inlineStyles: this.createGradientStyle(
          this.CONSTANTS.COLORS.PURPLE.LIGHT,
          this.CONSTANTS.COLORS.PURPLE.DARK,
          `${this.CONSTANTS.COLORS.PURPLE.LIGHT}66`,
          `${this.CONSTANTS.COLORS.PURPLE.LIGHT}4D`
        )
      }
    };
  }

  // 스타일 가져오기 (타입 안전성 포함)
  getStyle(styleType, isEnabled = true) {
    if (!styleType || typeof styleType !== 'string') {
      console.warn('Invalid styleType provided:', styleType);
      return this.styles.default;
    }

    if (styleType === 'toggle') {
      return this.createToggleStyle(isEnabled);
    }

    const style = this.styles[styleType];
    if (!style) {
      console.warn(`Style type '${styleType}' not found, using default`);
      return this.styles.default;
    }

    return style;
  }

  // 기본 스타일 적용
  applyBaseStyle(button, style) {
    if (!button || !style) {
      console.error('Invalid parameters for applyBaseStyle');
      return;
    }

    button.className = style.className;
    Object.assign(button.style, style.inlineStyles);
  }

  // data 속성 적용
  applyDataAttributes(button, options = {}) {
    if (!button) return;

    if (options.dataId) {
      button.setAttribute('data-item-id', options.dataId);
    }
  }

  // 토글 버튼 로직 적용
  applyToggleLogic(button, item, isEnabled) {
    if (!button || !item) {
      console.error('Invalid parameters for applyToggleLogic');
      return;
    }

    const style = this.getStyle('toggle', isEnabled);
    this.applyBaseStyle(button, style);
    
    button.innerHTML = `${style.icon} ${item.text}`;
    button.title = `${item.title}${style.titleSuffix}`;
  }

  // 일반 버튼 로직 적용
  applyNormalLogic(button, item) {
    if (!button || !item) {
      console.error('Invalid parameters for applyNormalLogic');
      return;
    }

    button.innerHTML = item.text;
    button.title = item.title;
  }

  // 버튼 타입별 스타일 적용
  applyButtonTypeStyle(button, item, options = {}) {
    if (!item.btnType) {
      this.applyNormalLogic(button, item);
      return;
    }

    const isToggleButton = item.btnType === 'toggle';
    const isEnabled = isToggleButton ? options.isEnabled : true;
    
    if (isToggleButton) {
      this.applyToggleLogic(button, item, isEnabled);
    } else {
      const buttonStyle = this.getStyle(item.btnType);
      this.applyBaseStyle(button, buttonStyle);
      this.applyNormalLogic(button, item);
    }
  }

  // 버튼에 스타일 적용 (메인 메서드)
  applyStyle(button, menuType, item, options = {}) {
    if (!button || !item) {
      console.error('Invalid parameters for applyStyle');
      return button;
    }

    // 기본 스타일 적용
    const baseStyle = this.getStyle('default');
    this.applyBaseStyle(button, baseStyle);
    
    // data 속성 적용
    this.applyDataAttributes(button, options);
    
    // 버튼 타입별 스타일 적용
    this.applyButtonTypeStyle(button, item, options);
    
    return button;
  }

  // 토글 버튼 업데이트
  updateToggleButton(button, item, isEnabled) {
    this.applyToggleLogic(button, item, isEnabled);
  }
}

export default SubMenuStyles; 