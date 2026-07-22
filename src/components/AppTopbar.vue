<!-- src/components/AppTopbar.vue -->
<!-- 全局顶部导航栏组件 —— 基于 Figma m-X-Frame 组件 1:1 还原 -->
<template>
  <header class="app-topbar">
    <div class="topbar-left">
      <!-- MEOS Logo：预留 60x14 SVG 占位，后续替换 -->
      <span class="app-logo">
        <svg class="logo-svg" width="60" height="14" viewBox="0 0 60 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.6228 0.00839233C23.5243 0.0084107 24.3464 0.175156 25.0681 0.50351C25.7876 0.831471 26.4107 1.28448 26.9167 1.85214C27.4223 2.41885 27.8181 3.10373 28.0925 3.88828C28.3651 4.66859 28.5027 5.52424 28.5037 6.4332V7.43124H16.6013C16.578 7.16832 16.5632 6.90385 16.5632 6.63535C16.5632 5.75973 16.7056 4.91633 16.9871 4.12851C17.2675 3.33912 17.6744 2.63088 18.196 2.02206C18.7184 1.41306 19.3621 0.919045 20.1072 0.556244C20.8554 0.192623 21.7017 0.00839233 22.6228 0.00839233ZM22.4929 2.18613C22.008 2.18619 21.5564 2.284 21.1511 2.47812C20.7402 2.6746 20.3755 2.94002 20.0662 3.26328C19.7582 3.58613 19.5134 3.9662 19.3396 4.39218C19.2069 4.71543 19.1193 5.05288 19.0779 5.39609H26.0134C25.9738 5.02132 25.8905 4.66089 25.7615 4.32187C25.5961 3.89078 25.3605 3.51331 25.0623 3.19882C24.7654 2.88759 24.3951 2.63878 23.9636 2.45761C23.529 2.27702 23.0337 2.18613 22.4929 2.18613Z" fill="#2E3742"/>
          <path d="M30.6605 3.16501C31.878 0.856789 34.5161 -0.349138 37.3324 0.0888413C40.4449 0.572873 42.378 2.6459 42.7005 5.78415C42.8189 6.94131 42.7706 8.07706 42.4691 9.19333C41.6895 12.1045 39.4791 13.7115 36.3031 13.7129C32.4147 13.7147 29.9029 11.1934 29.8255 7.21482C29.7971 5.80133 29.9919 4.42988 30.6605 3.16501ZM36.3597 2.08103C34.4928 2.05655 33.1805 3.06816 32.6097 4.97263C32.2417 6.24674 32.412 7.93811 32.514 8.44822C32.8966 10.3509 34.2666 11.6177 35.9935 11.667C38.1112 11.7273 39.4686 10.7343 40.0091 8.70017C40.3274 7.50306 40.3262 6.29418 40.013 5.09568C39.5126 3.17491 38.2044 2.10565 36.3597 2.08103Z" fill="#2E3742"/>
          <path d="M53.7208 7.77283C53.3327 7.30272 52.9105 6.97848 52.3252 6.66956C51.7535 6.36855 51.1268 6.10051 50.4623 5.87707C49.8197 5.66152 49.2116 5.43669 48.6548 5.20907C48.1162 4.98795 47.6646 4.73989 47.3128 4.46813C47.0039 4.23029 46.8539 3.93996 46.8539 3.58134C46.8539 3.1758 47.0305 2.85481 47.3934 2.59978C47.7788 2.32802 48.3589 2.18959 49.1166 2.18959C49.7885 2.18959 50.377 2.30944 50.8644 2.5445C51.3104 2.76004 51.5629 3.15118 51.637 3.74114L51.6664 3.96922H52.7893C52.9217 3.96922 53.0792 3.97341 53.2618 3.9813C53.4538 3.99059 53.6276 3.99431 53.7842 3.99431H54.061L54.0456 3.71838C54.0092 3.0894 53.8615 2.53056 53.6071 2.05859C53.3485 1.58152 52.9902 1.18713 52.5414 0.885644C52.102 0.5902 51.5802 0.369546 50.9907 0.22554C50.4129 0.0857154 49.782 0.0151062 49.1175 0.0151062C48.5206 0.0151062 47.941 0.0866445 47.3958 0.227398C46.8422 0.369546 46.3436 0.582303 45.9154 0.857772C45.4755 1.14207 45.0902 1.49836 44.8241 1.94618C44.5548 2.40142 44.4369 2.9937 44.4453 3.55532C44.4546 4.26374 44.744 5.0121 45.1088 5.47199C45.4862 5.94721 45.9559 6.31234 46.5449 6.6324C47.1199 6.94457 47.7499 7.20796 48.4158 7.41468C49.0569 7.61489 49.6632 7.83044 50.2181 8.05527C50.7521 8.27546 51.2027 8.52724 51.5569 8.80642C51.8681 9.05356 52.02 9.36619 52.02 9.75918C52.02 10.0936 51.9362 10.3617 51.7679 10.58C51.5895 10.81 51.3621 10.9962 51.0928 11.1305C50.8113 11.2712 50.494 11.3697 50.1482 11.4236C49.7946 11.4807 49.4484 11.51 49.1185 11.51C48.3445 11.51 47.7005 11.333 47.2033 10.9856C46.7262 10.6497 46.4778 10.0727 46.448 9.218L46.4382 8.96669H43.9807L43.9863 9.23333C44.0045 9.96404 44.1592 10.6172 44.4485 11.1779C44.737 11.7348 45.1205 12.204 45.5906 12.5724C46.0566 12.9399 46.6018 13.2162 47.2089 13.3946C47.8114 13.5698 48.4535 13.6585 49.1194 13.6585C49.8123 13.6585 50.4856 13.5837 51.1174 13.4355C51.7591 13.285 52.3294 13.0453 52.8094 12.7262C53.3014 12.3987 53.7273 11.9722 54.0186 11.4557C54.3116 10.9345 54.4976 10.2929 54.4309 9.56083C54.3624 8.84451 54.1215 8.25781 53.7208 7.77283" fill="#2E3742"/>
          <path d="M26.0411 8.68163C25.8734 9.24511 25.6236 9.7417 25.3021 10.1593C24.9848 10.5704 24.5943 10.8998 24.1418 11.1376C23.6936 11.3727 23.1857 11.4911 22.6326 11.4911C22.0795 11.4911 21.572 11.3727 21.1238 11.1376C20.6718 10.9002 20.2864 10.5718 19.978 10.1607C19.6644 9.74448 19.4193 9.24557 19.2492 8.68024C19.2175 8.57432 19.1919 8.46655 19.1658 8.35785H16.719C16.7842 8.74063 16.87 9.1155 16.9855 9.47552C17.2511 10.3066 17.643 11.0419 18.1504 11.663C18.6607 12.2883 19.3009 12.7863 20.0525 13.143C20.8046 13.5007 21.6727 13.6809 22.6326 13.6809C23.592 13.6809 24.4643 13.4993 25.2247 13.1439C25.9838 12.7872 26.6329 12.2901 27.1524 11.6644C27.6683 11.0433 28.0643 10.3075 28.3309 9.47552C28.4464 9.1155 28.5326 8.74063 28.5974 8.35785H26.1245C26.0994 8.46794 26.0728 8.57572 26.0411 8.68163" fill="#246EE5"/>
          <path d="M6.47314 0.0176697H8.90735V13.6815H6.47314V0.0176697Z" fill="#2E3742"/>
          <path d="M4.11169 0.0172797H4.06416C3.48403 0.020996 2.93326 0.145491 2.43421 0.366145C1.50647 0.776329 0.762321 1.52005 0.350873 2.44447C0.126743 2.94849 0 3.50454 0 4.09171V13.6816H2.43421V7.81588V4.09125H2.43467C2.43467 4.0866 2.43421 4.08196 2.43421 4.07778C2.43421 3.17611 3.16764 2.44447 4.07254 2.44447C4.08559 2.44447 4.09864 2.44587 4.11169 2.44633V2.44401H5.2561V0.0168152L4.11169 0.0172797V0.0172797Z" fill="#2E3742"/>
          <path d="M11.2305 0.0172797H11.278C11.8581 0.020996 12.4089 0.145491 12.908 0.366145C13.8357 0.776329 14.5798 1.52005 14.9913 2.44447C15.2154 2.94849 15.3422 3.50454 15.3422 4.09171V13.6816H12.908V7.81588V4.09125H12.9075C12.9075 4.0866 12.908 4.08196 12.908 4.07778C12.908 3.17611 12.1745 2.44447 11.2696 2.44447C11.2566 2.44447 11.2435 2.44587 11.2305 2.44633V2.44401H10.0861V0.0168152L11.2305 0.0172797V0.0172797Z" fill="#2E3742"/>
        </svg>
      </span>
      <span class="topbar-divider"></span>

      <!-- 类型一 & 类型二：九宫格图标 + 面包屑 -->
      <template v-if="type !== 'standalone'">
        <!-- 九宫格图标 32x32 容器，20x20 SVG，无 hover 效果 -->
        <span class="topbar-grid-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="6" height="6" rx="1.4" fill="#414B58"/>
          <rect x="11" y="3" width="6" height="6" rx="1.4" fill="#8A939E"/>
          <rect x="3" y="11" width="6" height="6" rx="1.4" fill="#8A939E"/>
          <rect x="11" y="11" width="6" height="6" rx="1.4" fill="#414B58"/>
          </svg>
        </span>
        <!-- 自定义面包屑导航 (一二级菜单无 hover) -->
        <div v-if="breadcrumb && breadcrumb.length > 0" class="topbar-breadcrumb">
          <template v-for="(crumb, index) in breadcrumb" :key="index">
            <span class="crumb-text">{{ crumb.label }}</span>
            <span v-if="index < breadcrumb.length - 1" class="crumb-separator">/</span>
          </template>
        </div>
      </template>

      <!-- 类型三：页面标题 -->
      <template v-else>
        <span class="topbar-page-title">{{ pageTitle }}</span>
      </template>
    </div>

    <!-- 三级菜单 tabs —— 仅类型一显示 -->
    <div v-if="type === 'regular' && tabs.length > 0" class="topbar-center" ref="tabsContainerRef">
      <span
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="topbar-tab"
        :class="{ active: modelValue === tab.key }"
        @click="$emit('update:modelValue', tab.key)"
      >{{ tab.label }}</span>
      
      <!-- "更多"：纯自定义实现，取代 m-select -->
      <div 
        v-if="hiddenTabs.length > 0" 
        class="topbar-dropdown-trigger" 
        :class="{ active: activeHiddenTab }"
        ref="moreDropdownRef"
        @click="toggleMore"
      >
        <span>{{ activeHiddenTab ? activeHiddenTab.label : topbarText('topbar.more', '更多') }}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8.46176 10.4434C8.22183 10.7326 7.77813 10.7326 7.53821 10.4434L3.83789 5.9831C3.51348 5.59206 3.79158 5 4.29967 5L11.7003 5C12.2084 5 12.4865 5.59206 12.1621 5.9831L8.46176 10.4434Z" :fill="activeHiddenTab ? 'var(--primary-color)' : 'var(--gray-600)'"/>
        </svg>
        <!-- 下拉菜单 -->
        <div class="custom-dropdown-menu" v-show="isMoreOpen">
           <div 
             v-for="tab in hiddenTabs" 
             :key="tab.key" 
             class="dropdown-item" 
             :class="{ active: modelValue === tab.key }"
             @click.stop="handleTabClick(tab.key)"
           >
             {{ tab.label }}
           </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的测量用容器 -->
    <div class="topbar-measure" ref="measureDevRef" aria-hidden="true" v-if="type === 'regular' && tabs.length > 0">
      <span v-for="tab in tabs" :key="'m-'+tab.key" class="topbar-tab measure-tab">{{ tab.label }}</span>
      <div class="topbar-dropdown-trigger measure-more">
        <span>{{ topbarText('topbar.more', '更多') }}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8.46176 10.4434C8.22183 10.7326 7.77813 10.7326 7.53821 10.4434L3.83789 5.9831C3.51348 5.59206 3.79158 5 4.29967 5L11.7003 5C12.2084 5 12.4865 5.59206 12.1621 5.9831L8.46176 10.4434Z" fill="var(--gray-600)"/>
        </svg>
      </div>
    </div>

    <!-- 右侧工具区 —— 类型三不显示 -->
    <div v-if="type !== 'standalone'" class="topbar-right">
      <m-button
        v-if="showLanguageSwitch"
        type="text"
        size="small"
        :title="languageSwitchTitle"
        :aria-label="languageSwitchTitle"
        @click="toggleLocale"
      >{{ isEnglish ? '中文' : 'EN' }}</m-button>
      <span v-if="showLanguageSwitch" class="topbar-divider"></span>
      <!-- 图标容器：32x32，内部 SVG 20x20 -->
      <span class="topbar-icon" title="AI">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.71582 12.5286C2.37932 12.679 2.37934 13.1564 2.71582 13.3069L7.05078 15.2395C7.4848 15.4331 7.83182 15.7801 8.02539 16.2141L9.95801 20.5491C10.1084 20.8856 10.5859 20.8856 10.7363 20.5491L12.6689 16.2141C12.8625 15.7801 13.2095 15.4331 13.6436 15.2395L17.9785 13.3069C18.3151 13.1565 18.3151 12.679 17.9785 12.5286L13.6436 10.5959C13.2095 10.4024 12.8625 10.0554 12.6689 9.62134L10.7363 5.28638C10.5859 4.94989 10.1084 4.94988 9.95801 5.28638L8.02539 9.62134C7.83182 10.0554 7.48481 10.4024 7.05078 10.5959L2.71582 12.5286Z" stroke="#1A2028" stroke-width="1.5"/>
          <path d="M15.3984 4.07022C15.0942 4.23001 15.0942 4.66532 15.3984 4.8251L16.5566 5.4335C16.9023 5.61503 17.1846 5.8975 17.3662 6.24307L17.9756 7.40225C18.1355 7.70616 18.5707 7.70628 18.7305 7.40225L19.3389 6.24307C19.5204 5.89746 19.8028 5.61507 20.1484 5.4335L21.3076 4.8251C21.6116 4.66532 21.6115 4.23011 21.3076 4.07022L20.1484 3.46085C19.8029 3.27924 19.5204 2.99689 19.3389 2.65128L18.7305 1.49307C18.5707 1.18885 18.1354 1.18885 17.9756 1.49307L17.3662 2.65128C17.1846 2.99702 16.9024 3.27925 16.5566 3.46085L15.3984 4.07022Z" stroke="#8A939E" stroke-width="1.5"/>
        </svg>
      </span>
      <span class="topbar-icon" :title="topbarText('topbar.clipboard', '剪贴板')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.3639 16.591C16.3639 17.2178 15.8539 17.7274 15.2275 17.7274H5.22754C4.92627 17.727 4.63744 17.6072 4.42441 17.3941C4.21138 17.1811 4.09154 16.8923 4.09118 16.591V5.68191C4.09118 5.05509 4.60118 4.54555 5.22754 4.54555H6.51936L6.42845 5.45464H5.68208C5.50125 5.45464 5.32783 5.52647 5.19997 5.65434C5.0721 5.78221 5.00027 5.95563 5.00027 6.13646C5.00027 6.31729 5.0721 6.49071 5.19997 6.61858C5.32783 6.74644 5.50125 6.81828 5.68208 6.81828H14.773C14.9538 6.81828 15.1272 6.74644 15.2551 6.61858C15.383 6.49071 15.4548 6.31729 15.4548 6.13646C15.4548 5.95563 15.383 5.78221 15.2551 5.65434C15.1272 5.52647 14.9538 5.45464 14.773 5.45464H14.0266L13.9357 4.54555H15.2275C15.8539 4.54555 16.3639 5.05509 16.3639 5.68191V16.591ZM8.09708 2.47737C8.10242 2.42123 8.12855 2.36911 8.17035 2.33126C8.21216 2.29342 8.2666 2.27257 8.32299 2.27282H12.1321C12.2494 2.27282 12.3466 2.36055 12.358 2.47737L12.4289 3.18191L12.6557 5.45464H7.79936L8.02663 3.18191L8.09708 2.47737ZM15.2275 3.18191H13.7989L13.7153 2.34146C13.6769 1.94853 13.4934 1.58401 13.2007 1.31915C12.9079 1.05429 12.5269 0.908111 12.1321 0.909186H8.32299C7.9282 0.908111 7.54718 1.05429 7.25442 1.31915C6.96165 1.58401 6.77816 1.94853 6.73981 2.34146L6.65618 3.18191H5.22754C4.56472 3.18263 3.92925 3.44626 3.46057 3.91494C2.99188 4.38363 2.72826 5.01909 2.72754 5.68191V16.591C2.72754 17.9692 3.8489 19.091 5.22754 19.091H15.2275C16.6062 19.091 17.7275 17.9692 17.7275 16.591V5.68191C17.7275 4.30373 16.6062 3.18191 15.2275 3.18191Z" fill="#1A2028"/>
        <path d="M14.0457 8.77281C13.901 8.66455 13.7192 8.61811 13.5403 8.64367C13.3613 8.66924 13.1998 8.76472 13.0912 8.90918L9.43117 13.7896L7.25526 11.976C7.11576 11.8648 6.93824 11.8126 6.76073 11.8307C6.58323 11.8488 6.41988 11.9357 6.30568 12.0727C6.19148 12.2098 6.13552 12.3862 6.1498 12.564C6.16409 12.7419 6.24747 12.9071 6.38208 13.0242L8.74208 14.991C8.86078 15.089 8.99805 15.1621 9.14567 15.2059C9.29329 15.2496 9.44821 15.2631 9.60117 15.2455C9.75412 15.2275 9.90183 15.1787 10.0354 15.1021C10.169 15.0255 10.2857 14.9226 10.3784 14.7996L14.1821 9.72736C14.2359 9.65572 14.275 9.57417 14.2973 9.48739C14.3195 9.40061 14.3245 9.31029 14.3118 9.2216C14.2992 9.13291 14.2691 9.04758 14.2235 8.9705C14.1778 8.89341 14.1174 8.82654 14.0457 8.77281Z" fill="#8A939E"/>
        </svg>
      </span>
      <span class="topbar-icon topbar-icon--badge" :title="topbarText('topbar.messages', '消息')">
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20.55C8.15001 20.55 6.70001 19.05 6.70001 17.25C6.70001 16.85 7.05001 16.5 7.45001 16.5C7.85001 16.5 8.20001 16.85 8.20001 17.25C8.20001 18.25 9.00001 19.05 10 19.05C11 19.05 11.8 18.25 11.8 17.25C11.8 16.85 12.15 16.5 12.55 16.5C12.95 16.5 13.3 16.85 13.3 17.25C13.3 19.1 11.85 20.55 10 20.55V20.55Z" fill="#8A939E"/>
          <path d="M17.1 17.75H2.9C1.9 17.75 1.05 16.9 1 15.9C1 15.1 1.45 14.4 2.15 14.05C2.6 13.85 2.8 13.75 3 13.45C3.5 12.6 3.45 11.5 3.35 10.35C3.3 9.35 3.2 8.3 3.55 7.25C4.15 5.2 5.7 3.5 7.6 2.7C8.35 2.4 9.1 2.25 9.9 2.25H10C11.95 2.25 13.9 3.2 15.15 4.75C15.95 5.7 16.45 6.95 16.65 8.35C16.75 9.1 16.7 9.85 16.65 10.55C16.6 11.55 16.55 12.5 16.9 13.3C17.05 13.65 17.35 13.95 17.75 14.15C18.15 14.35 18.95 14.8 18.95 15.9C19 16.9 18.15 17.75 17.1 17.75ZM10 3.75H9.95C9.35 3.75 8.75 3.9 8.2 4.1C6.7 4.7 5.5 6.05 5 7.65C4.75 8.4 4.8 9.3 4.9 10.2C5 11.5 5.05 12.9 4.35 14.15C3.9 14.9 3.3 15.15 2.85 15.4C2.6 15.5 2.5 15.65 2.5 15.85C2.5 16.05 2.7 16.25 2.9 16.25H17.15C17.35 16.25 17.5 16.05 17.5 15.85C17.5 15.7 17.5 15.65 17.1 15.45C16.45 15.1 15.9 14.6 15.6 13.95C15.1 12.85 15.15 11.65 15.2 10.5C15.25 9.8 15.3 9.2 15.2 8.6C15.05 7.5 14.6 6.5 14 5.75C13 4.45 11.5 3.75 10 3.75V3.75Z" fill="#1A2028"/>
          <path d="M10 3.65C9.6 3.65 9.25 3.3 9.25 2.9V1.75C9.25 1.3 9.6 1 10 1C10.4 1 10.75 1.35 10.75 1.75V2.9C10.75 3.3 10.4 3.65 10 3.65Z" fill="#8A939E"/>
          <rect x="11.5" y="0.5" width="9" height="9" rx="4.5" fill="#F55047"/>
          <rect x="11.5" y="0.5" width="9" height="9" rx="4.5" stroke="white"/>
          </svg>
        <span class="icon-badge"></span>
      </span>
      <span class="topbar-icon" :title="topbarText('topbar.calendar', '日历')">
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.5 1.5H16.251C17.77 1.5 19 2.731 19 4.25225V16.2475C19 17.7678 17.7695 19 16.251 19H2.749C1.23 19 0 17.769 0 16.2478V4.2525C0 2.73225 1.2305 1.5 2.749 1.5H4.5V0.75C4.5 0.551088 4.57902 0.360322 4.71967 0.21967C4.86032 0.0790178 5.05109 0 5.25 0C5.44891 0 5.63968 0.0790178 5.78033 0.21967C5.92098 0.360322 6 0.551088 6 0.75V1.5H13V0.75C13 0.551088 13.079 0.360322 13.2197 0.21967C13.3603 0.0790178 13.5511 0 13.75 0C13.9489 0 14.1397 0.0790178 14.2803 0.21967C14.421 0.360322 14.5 0.551088 14.5 0.75V1.5ZM14.5 3V3.75C14.5 3.94891 14.421 4.13968 14.2803 4.28033C14.1397 4.42098 13.9489 4.5 13.75 4.5C13.5511 4.5 13.3603 4.42098 13.2197 4.28033C13.079 4.13968 13 3.94891 13 3.75V3H6V3.75C6 3.94891 5.92098 4.13968 5.78033 4.28033C5.63968 4.42098 5.44891 4.5 5.25 4.5C5.05109 4.5 4.86032 4.42098 4.71967 4.28033C4.57902 4.13968 4.5 3.94891 4.5 3.75V3H2.749C2.58476 3.0002 2.42217 3.03275 2.27051 3.09579C2.11885 3.15883 1.9811 3.25113 1.86511 3.36741C1.74913 3.4837 1.65719 3.62169 1.59454 3.77351C1.5319 3.92534 1.49977 4.08801 1.5 4.25225V16.2475C1.49957 16.4118 1.53156 16.5746 1.59414 16.7265C1.65671 16.8784 1.74864 17.0165 1.86466 17.1329C1.98068 17.2492 2.11851 17.3415 2.27026 17.4045C2.42201 17.4675 2.58469 17.5 2.749 17.5H16.251C16.4152 17.4998 16.5778 17.4673 16.7295 17.4042C16.8812 17.3412 17.0189 17.2489 17.1349 17.1326C17.2509 17.0163 17.3428 16.8783 17.4055 16.7265C17.4681 16.5747 17.5002 16.412 17.5 16.2478V4.2525C17.5004 4.08819 17.4684 3.92542 17.4059 3.77349C17.3433 3.62157 17.2514 3.48348 17.1353 3.36713C17.0193 3.25079 16.8815 3.15847 16.7297 3.09548C16.578 3.03248 16.4153 3.00003 16.251 3H14.5Z" fill="#1A2028"/>
        <path d="M4.5 9H15" stroke="#8A939E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="bevel"/>
        <path d="M4.5 13H10.5" stroke="#8A939E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="bevel"/>
        </svg>
      </span>
      <span class="topbar-icon" :title="topbarText('topbar.help', '帮助')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 18.3333C14.6025 18.3333 18.3333 14.6025 18.3333 10C18.3333 5.3975 14.6025 1.66667 10 1.66667C5.3975 1.66667 1.66667 5.3975 1.66667 10C1.66667 14.6025 5.3975 18.3333 10 18.3333ZM10 20C4.4775 20 0 15.5225 0 10C0 4.4775 4.4775 0 10 0C15.5225 0 20 4.4775 20 10C20 15.5225 15.5225 20 10 20Z" fill="#1A2028"/>
        <path d="M10.2577 4C8.96851 4 7.94423 4.34615 7.20251 5.05495C6.44313 5.74725 6.07227 6.68681 6.07227 7.89011H7.94423C7.94423 7.16484 8.10317 6.58791 8.42105 6.19231C8.77425 5.73077 9.35703 5.5 10.1517 5.5C10.7875 5.5 11.282 5.66483 11.6352 5.99451C11.9707 6.32418 12.1473 6.76923 12.1473 7.34615C12.1473 7.77473 11.9884 8.17033 11.6705 8.54945L11.3703 8.86264C10.2754 9.76923 9.60427 10.4451 9.35703 10.9066C9.12745 11.3352 9.02149 11.8626 9.02149 12.4725V12.7527H10.9111V12.4725C10.9111 12.0604 10.9994 11.6978 11.1937 11.3681C11.3526 11.0714 11.5999 10.7912 11.9177 10.5275C12.7654 9.85165 13.2599 9.42308 13.4188 9.24176C13.8427 8.71429 14.0723 8.03846 14.0723 7.23077C14.0723 6.24176 13.7191 5.45055 13.0303 4.87363C12.3239 4.28022 11.4056 4 10.2577 4V4ZM9.95748 13.6429C9.58661 13.6429 9.28639 13.7418 9.05681 13.9725C8.79191 14.1868 8.66829 14.467 8.66829 14.8132C8.66829 15.1429 8.79191 15.4231 9.05681 15.6538C9.28639 15.8846 9.58661 16 9.95748 16C10.3107 16 10.6286 15.8846 10.8935 15.6703C11.1407 15.4396 11.2643 15.1593 11.2643 14.8132C11.2643 14.467 11.1407 14.1868 10.8935 13.9725C10.6462 13.7418 10.3283 13.6429 9.95748 13.6429V13.6429Z" fill="#8A939E"/>
        </svg>
      </span>
      
      <!-- 禹数项目：自定义实现，取代 m-select -->
      <div class="topbar-dropdown-trigger">
        <span>禹数项目</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8.46176 10.4434C8.22183 10.7326 7.77813 10.7326 7.53821 10.4434L3.83789 5.9831C3.51348 5.59206 3.79158 5 4.29967 5L11.7003 5C12.2084 5 12.4865 5.59206 12.1621 5.9831L8.46176 10.4434Z" fill="var(--gray-600)"/>
        </svg>
      </div>
      
      <span class="topbar-divider"></span>
      <!-- 用户名：纯文字，有 hover -->
      <span class="topbar-user">小禹</span>
    </div>
  </header>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useLocale } from '../i18n'

const props = defineProps({
  /**
   * 导航类型：
   * - 'regular'    类型一：常规导航（一级+二级+三级菜单）
   * - 'simple'     类型二：二级导航（只有一级+二级菜单）
   * - 'standalone' 类型三：独立页面
   */
  type: {
    type: String,
    default: 'regular',
    validator: (v) => ['regular', 'simple', 'standalone'].includes(v)
  },
  /** 面包屑数据，适用于 type = 'regular' | 'simple' */
  breadcrumb: {
    type: Array,
    default: () => [
      { label: '一级菜单名称', to: '/' },
      { label: '二级菜单名称' }
    ]
  },
  /** 三级菜单 tabs，适用于 type = 'regular' */
  tabs: {
    type: Array,
    default: () => []
    // 格式: [{ key: 'tab1', label: '标签名' }, ...]
  },
  /** 当前激活的 tab key（v-model） */
  modelValue: {
    type: String,
    default: ''
  },
  /** 是否显示"更多"按钮 */
  hasMore: {
    type: Boolean,
    default: false
  },
  /** 独立页面标题，适用于 type = 'standalone' */
  pageTitle: {
    type: String,
    default: '页面名称'
  },
  localizationEnabled: {
    type: Boolean,
    default: false
  },
  showLanguageSwitch: {
    type: Boolean,
    default: false
  }
})

const { isEnglish, t, toggleLocale } = useLocale()
const topbarText = (key, fallback) => props.localizationEnabled ? t(key) : fallback
const languageSwitchTitle = computed(() => (
  isEnglish.value ? t('topbar.switchToChinese') : t('topbar.switchToEnglish')
))

const tabsContainerRef = ref(null)
const measureDevRef = ref(null)
const moreDropdownRef = ref(null)
const visibleTabs = ref([])
const hiddenTabs = ref([])
let tabWidths = []
let moreBtnWidth = 0
const gap = 8

const isMoreOpen = ref(false)
const toggleMore = () => {
  isMoreOpen.value = !isMoreOpen.value
}

const handleGlobalClick = (event) => {
  if (moreDropdownRef.value && !moreDropdownRef.value.contains(event.target)) {
    isMoreOpen.value = false
  }
}

const activeHiddenTab = computed(() => {
  return hiddenTabs.value.find(tab => tab.key === props.modelValue)
})

const emit = defineEmits(['update:modelValue'])

const handleTabClick = (key) => {
  emit('update:modelValue', key)
  isMoreOpen.value = false
}

const calculateWidths = () => {
  if (!measureDevRef.value) return
  const tabElements = measureDevRef.value.querySelectorAll('.measure-tab')
  tabWidths = Array.from(tabElements).map(el => el.getBoundingClientRect().width)
  moreBtnWidth = measureDevRef.value.querySelector('.measure-more')?.getBoundingClientRect().width || 65
}

const updateTabs = (containerWidth) => {
  if (!containerWidth || tabWidths.length === 0) return
  
  const totalTabsWidth = tabWidths.reduce((sum, w, i) => sum + w + (i > 0 ? gap : 0), 0)

  if (totalTabsWidth <= containerWidth) {
    visibleTabs.value = [...props.tabs]
    hiddenTabs.value = []
    return
  }

  const availableWidth = containerWidth - moreBtnWidth - gap
  const vTabs = []
  const hTabs = []
  let currentWidth = 0
  let i = 0

  for (; i < props.tabs.length; i++) {
    const w = tabWidths[i]
    if (i === 0) {
       if (w > availableWidth) break
       vTabs.push(props.tabs[i])
       currentWidth += w
    } else {
       if (currentWidth + gap + w <= availableWidth) {
         vTabs.push(props.tabs[i])
         currentWidth += gap + w
       } else {
         break
       }
    }
  }

  for (; i < props.tabs.length; i++) {
    hTabs.push(props.tabs[i])
  }

  if (vTabs.length === 0 && props.tabs.length > 0) {
     vTabs.push(props.tabs[0])
     hTabs.shift()
  }

  visibleTabs.value = vTabs
  hiddenTabs.value = hTabs
}

let resizeObserver
let rafId
let lastWidth = 0

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
  visibleTabs.value = [...props.tabs]
  calculateWidths()
  if (tabsContainerRef.value) {
    resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width !== lastWidth) {
          lastWidth = entry.contentRect.width
          cancelAnimationFrame(rafId)
          rafId = requestAnimationFrame(() => {
            updateTabs(lastWidth)
          })
        }
      }
    })
    resizeObserver.observe(tabsContainerRef.value)
  }
})

watch(() => props.tabs, async () => {
  visibleTabs.value = [...props.tabs]
  hiddenTabs.value = []
  await nextTick()
  calculateWidths()
  if (tabsContainerRef.value) {
    updateTabs(tabsContainerRef.value.clientWidth)
  }
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('click', handleGlobalClick)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ========== 顶部导航栏 ========== */
.app-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 8px 16px;  /* Figma: padding 8 16 */
  background: var(--gray-0);
  box-shadow: var(--shadow-1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  font-size: 14px;
  line-height: 22px;  /* Figma 全局行高 22px */
}

/* ========== 左侧区域 ========== */
.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Logo: 60x14 SVG 预留 */
.app-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-svg {
  width: 60px;
  height: 14px;
}

/* 竖线分隔符: 1x16px, 颜色 gray-400 */
.topbar-divider {
  width: 1px;
  height: 16px;
  background-color: var(--gray-400);  /* 统一使用 grey/400 */
  margin: 0 8px;
  flex-shrink: 0;
}

/* 独立页面标题 */
.topbar-page-title {
  font-size: 14px;
  line-height: 22px;
  color: var(--title-color);
}

/* 左侧网格图标，无 hover */
.topbar-grid-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.topbar-grid-icon svg {
  width: 20px;
  height: 20px;
}

/* 自定义面包屑导航，无 hover */
.topbar-breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 22px;
  color: var(--title-color);
  white-space: nowrap;
}
.crumb-text {
  color: var(--title-color);
}
.crumb-separator {
  margin: 0 8px;
  color: var(--title-color);
}

/* ========== 中间三级菜单 Tabs ========== */
.topbar-center {
  display: flex;
  align-items: center;
  gap: var(--padding-2);
  flex: 1;
  min-width: 0;
  margin: 0 var(--padding-4);
}

/* Tab 样式 */
.topbar-tab {
  padding: 5px var(--padding-2);
  font-size: var(--font-m);
  line-height: 22px;
  color: var(--title-color);
  cursor: pointer;
  white-space: nowrap;
  border-radius: var(--big-radius);
  transition: all 0.2s ease;
  user-select: none;
}

.topbar-tab:hover {
  background-color: var(--alpha-30);
}

/* 选中态: 纯文字变蓝 */
.topbar-tab.active {
  color: var(--primary-color);
  font-weight: 500;
}

/* 更多 和 禹数项目 自定义下拉触发器 */
.topbar-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px var(--padding-2);
  font-size: var(--font-m);
  line-height: 22px;
  color: var(--title-color);
  cursor: pointer;
  border-radius: var(--big-radius);
  transition: background 0.2s;
  user-select: none;
  position: relative; /* 用于下拉菜单定位 */
  white-space: nowrap;
  flex-shrink: 0;
}
.topbar-dropdown-trigger:hover {
  background-color: var(--alpha-30);
}
.topbar-dropdown-trigger.active {
  color: var(--primary-color);
  font-weight: 500;
}

.custom-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--padding-1);
  background: var(--gray-0, #ffffff);
  border-radius: var(--big-radius);
  box-shadow: var(--shadow-2);
  padding: var(--padding-2) var(--padding-1);
  width: 240px;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  padding: 9px var(--padding-2) 9px var(--padding-3);
  align-items: center;
  gap: var(--padding-2);
  align-self: stretch;
  
  font-size: var(--font-m);
  line-height: 22px;
  color: var(--title-color);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  border-radius: var(--big-radius);
}
.dropdown-item:hover {
  background: var(--alpha-30);
}
.dropdown-item.active {
  color: var(--primary-color);
  font-weight: 500;
  background: var(--blue-50);
}

/* 隐藏的测量用容器 */
.topbar-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
  display: flex;
  gap: 8px;
}

/* ========== 右侧工具区 ========== */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 图标容器: 32x32, 内部 SVG 20x20 (padding 6px) */
.topbar-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  position: relative;
  flex-shrink: 0;
}


.topbar-icon:hover {
  background-color: var(--alpha-30);
}

/* 消息图标红点 */
.topbar-icon--badge .icon-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--danger-color);
}

/* 用户名：带 hover 效果 */
.topbar-user {
  display: flex;
  align-items: center;
  padding: 5px 8px;    /* Figma: 上下 5px，左右 8px */
  font-size: 14px;
  line-height: 22px;
  color: var(--title-color);
  white-space: nowrap;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.topbar-user:hover {
  background-color: var(--alpha-30);
}
</style>
