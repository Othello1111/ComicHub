import React from 'react';
import { getLanguageData, getLocale, setLocale } from '../../locales';
import { Dropdown, Icon, Menu } from 'antd';
import styles from './index.less';
type Props = {}
interface ObjectType {
  [key: string]: string;
}
interface Event {
  key: string;
}
const SelectLang: React.FunctionComponent<Props> = () => {
  function changeLang(event: Event): void {
    const { key } = event;
    setLocale(key);
  }

  const selectedLang = getLocale();
  const locales: string[] = ['zh-CN', 'en-US'];
  const languageLabels: ObjectType = {
    'zh-CN': '中文',
    'en-US': 'English',
  };
  const title: string = getLanguageData( 'component.SelectLang.language' );
  const languageIcons: ObjectType = {
    'zh-CN': '🇨🇳',
    'en-US': '🇬🇧',
  };
  const langMenu = (
    <Menu
      className={styles.menu}
      selectedKeys={[selectedLang]}
      onClick={changeLang}
    >
      {locales.map(locale => (
        <Menu.Item key={locale}>
          <span role="img" aria-label={languageLabels[locale]}>
            {languageIcons[locale]}
          </span>
          {languageLabels[locale]}
        </Menu.Item>
      ))}
    </Menu>
  );
  return (
    <Dropdown overlay={langMenu} placement="bottomRight">
      <Icon type="global" title={title} className={styles.icon} />
    </Dropdown>
  );
};

export default SelectLang;
