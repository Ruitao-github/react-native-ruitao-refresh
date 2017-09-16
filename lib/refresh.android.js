'use strict';

import  React,{PropTypes} from 'react'
import {Image,
  View,
  Text,
  StyleSheet,
  ListView,
  Easing,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated} from 'react-native'

const {width} = Dimensions.get('window')

export const status = {
    STATUS_IDLE:0, // 闲置状态
    STATUS_WILL_REFRESH:1, // 将要刷新
    STATUS_REFRESHING:2, // 刷新中
}

export const loadMoreStatus = {
    STATUS_LOADMORE_IDLE: 0, // loadmore闲置中
    STATUS_WILL_LOADMORE: 1, // 即将loadmore
    STATUS_LOADMOREING: 2, // loadmore中
    STATUS_LOADMOREED: 3, // 加载完成
}

export default class reactNativeYJrefresh extends React.Component {

    scrollview: ScrollView

    static propTypes = {
        pullHeight: PropTypes.number,
        loadMoreHeight: PropTypes.number,
        statusTextObj: PropTypes.object,
        autoLoadMore: PropTypes.bool,
        loadMoreStatusTextObj: PropTypes.object,
        onEndReachedThreshold: PropTypes.number,
    }

    static defaultProps = {
        pullHeight: 80,
        loadMoreHeight: 80,
        autoLoadMore: false,
        onEndReachedThreshold: 50,
        statusTextObj:{
            [status.STATUS_IDLE]:'下拉刷新...',
            [status.STATUS_WILL_REFRESH]:'放开刷新...',
            [status.STATUS_REFRESHING]:'刷新中...'
        },
        loadMoreStatusTextObj:{
            [loadMoreStatus.STATUS_LOADMORE_IDLE]:'上拉加载...',
            [loadMoreStatus.STATUS_WILL_LOADMORE]:'松开加载...',
            [loadMoreStatus.STATUS_LOADMOREING]:'数据加载中...',
            [loadMoreStatus.STATUS_LOADMOREED]:'数据全部加载完成'
        },
    }

    constructor(){
        super()
        this.scrollY = 0
        this.height = 0
        this.maxScroll = 0
        this.canScroll = false
        this.contentHeight = 0
        this.scrollFromTop = true

        this.state = {
            refreshHeight: new Animated.Value(0),
            loadMoreHeight: new Animated.Value(0),
            isEnableScroll: false,
            refreshStatus: status.STATUS_IDLE,
            loadMoreStatus: loadMoreStatus.STATUS_LOADMORE_IDLE,
            startAutoLoadMore: false, 
        }
    }

    componentWillMount(){
        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => !this.state.isEnableScroll,
            onMoveShouldSetPanResponder: () => !this.state.isEnableScroll, 
            onPanResponderMove: this._handlerPanResponderMove.bind(this),
            onPanResponderRelease:this._handlerPanResponderEnd.bind(this),
            onPanResponderTerminate:this._handlerPanResponderEnd.bind(this),
        })
    }

    _handlerPanResponderMove(event,gestureState){
        if(this.state.refreshStatus == status.STATUS_REFRESHING 
            || this.state.loadMoreStatus == loadMoreStatus.STATUS_LOADMOREING){
            return false
        }
        let dy = gestureState.dy
        let offsetY = Math.abs(dy)

        // 顶部
        if(this.scrollY === 0){
            this.scrollFromTop = true
            if(dy >= 0) { // 向下
                if(this.scrollY != 0){
                    this.scrollview.scrollTo({y: 0,animated: false})
                }

                this.setState({
                    refreshStatus: this.state.refreshHeight._value >= this.props.pullHeight 
                    ? status.STATUS_WILL_REFRESH
                    :status.STATUS_IDLE
                })
                this.state.refreshHeight.setValue(offsetY * 0.5)
            }
        } else if(this.canScroll && this.scrollY >= this.maxScroll){ // 底部
            this.scrollFromTop = false
            if(dy <= 0) { // 向上滑动
                // 手势
                // 如果已经加载完成, 则不需要继续向上滑动
                if(this.state.loadMoreStatus != loadMoreStatus.STATUS_LOADMOREED){
                    this.setState({
                        loadMoreStatus: this.state.loadMoreHeight._value >= this.props.loadMoreHeight
                            ? loadMoreStatus.STATUS_WILL_LOADMORE
                            : loadMoreStatus.STATUS_LOADMORE_IDLE
                    })
                    !this.props.autoLoadMore && this.state.loadMoreHeight.setValue(offsetY * 0.5)
                }
            }
        }

        if(this.canScroll){
            if(this.scrollFromTop && dy <= 0){
                if(this.state.refreshHeight._value != 0) {
                    this.state.refreshHeight.setValue(0)
                }
                this.scrollview.scrollTo({y: offsetY,animated: true})
            } else if(!this.scrollFromTop && dy >= 0) {
                if(this.state.loadMoreHeight._value != 0) {
                    this.state.loadMoreHeight.setValue(0)
                }
                this.scrollview.scrollTo({y: this.maxScroll - offsetY,animated: true})
            }
        }

        // if(this._isToBottom()){ // 到底部了
        //     if(gestureState.dy < 0){
        //         this.state.loadMoreHeight.setValue(offsetY * 0.5)
        //     }
        // }else if(this.scrollY >= 0 && !this._isToBottom()){
        //     if(gestureState.dy <= 0){
        //         if(this.state.refreshHeight._value != 0) {
        //             this.state.refreshHeight.setValue(0)
        //         }
        //         this.scrollview.scrollTo({y:offsetY,animated:true})
        //     } else if(offsetY > 0){
        //         if(this.scrollY != 0){
        //             this.scrollY = 0
        //             this.scrollview.scrollTo({y:0,animated: false})
        //         }
        //         this.state.refreshHeight.setValue(offsetY * 0.5)
        //     }
        // }
    }

    _handlerPanResponderEnd(event,gestureState){
        if(this.state.refreshHeight._value >= this.props.pullHeight){
            this._animated(this.state.refreshHeight,this.props.pullHeight)
            // 这里去刷新加载数据
            this.setState({
                refreshStatus: status.STATUS_REFRESHING
            })
            this._onRefresh()
        } else {
            this._animated(this.state.refreshHeight)
        }

        if(this.state.loadMoreHeight._value >= this.props.loadMoreHeight){
            
            this._animated(this.state.loadMoreHeight,this.props.loadMoreHeight)

            // loadmore
            this.setState({
                loadMoreStatus: loadMoreStatus.STATUS_LOADMOREING
            })
            this._onLoadMore()
        } else {
            this._animated(this.state.loadMoreHeight)
        }

        if(this.scrollY > 0 && !this._isToBottom() && !this.state.isEnableScroll){
            this.setState({isEnableScroll: true})
        }
    }

    _isToBottom(){
        return this.scrollY >= Math.floor(this.maxScroll)
    }

    _onScroll(event){
        this.scrollY = event.nativeEvent.contentOffset.y
    }

    // 当停止滚动的时候去判断
    _onScrollEnd(){
        // 如果到顶部了则需要禁用scrollview的滚动, 启用手势
        if(this._isToBottom() && !this.props.autoLoadMore && this.state.isEnableScroll){
            this.setState({isEnableScroll: false})
        }
        if(this.scrollY === 0 && this.state.isEnableScroll){
            this.setState({isEnableScroll: false})
        }
    }

    _onLayout(e){
        const {height} = e.nativeEvent.layout
        this.height = height
        this.canScroll = this.contentHeight > height
        if(this.canScroll ){
            this.maxScroll = Math.floor(this.contentHeight - height)
        }
    }

    _onContentSizeChange(w,h){
        this.contentHeight = h
        this.canScroll = this.contentHeight > this.height
        if(this.canScroll){
            const ms = Math.floor(this.contentHeight - this.height)
            if(this.maxScroll < ms){ // 如果内容改变了, 则说明可以开启滚动
                this.setState({isEnableScroll: true})
            }
            this.maxScroll = ms
        }
    }

    _completedRefresh(){
        this.setState({
            refreshStatus: status.STATUS_IDLE
        })
        
        this._animated(this.state.refreshHeight)
    }

    _onRefresh(){
        if(this.state.refreshStatus != status.STATUS_REFRESHING){
            this.props.onRefresh(() => this._completedRefresh())
        }
    }

    _completedLoadMore(noMore = false){
        this.setState({
            loadMoreStatus: noMore ? loadMoreStatus.STATUS_LOADMOREED : loadMoreStatus.STATUS_LOADMORE_IDLE,
            startAutoLoadMore: false,
            isEnableScroll: true,
        })
        if(noMore){
            this.scrollview.scrollToEnd({animated: false})
        }

        this._animated(this.state.loadMoreHeight)
    }

    _animated(propObj,to = 0,duration = 200,easing = Easing.out(Easing.linear)){
        Animated.timing(propObj,{
            toValue:to,
            duration,
            easing,
        }).start()
    }

    _onLoadMore(){
        if(this.state.loadMoreStatus != loadMoreStatus.STATUS_LOADMOREING && this.props.onLoadMore){
            this.props.onLoadMore((noMore) => this._completedLoadMore(noMore))
        }
    }
    
    _renderFooter(){
        if(this.props.autoLoadMore){

            if(this.state.startAutoLoadMore){
                return(
                    <View style={styles.footer}>
                        {<ActivityIndicator/>}
                        <Text>{this.props.loadMoreStatusTextObj[loadMoreStatus.STATUS_LOADMOREING]}</Text>
                    </View>
                )
            } else if(this.state.loadMoreStatus == loadMoreStatus.STATUS_LOADMOREED){
                return (
                    <View style={styles.footer}>
                        <Text>{this.props.loadMoreStatusTextObj[loadMoreStatus.STATUS_LOADMOREED]}</Text>
                    </View>
                )
            } else {
                return null
            }
        } else { // 不自动加载
            if(this.state.loadMoreStatus != loadMoreStatus.STATUS_LOADMOREED){
                return null
            }
            return(
                <View style={styles.footer}>
                    <Text>{this.props.loadMoreStatusTextObj[this.state.loadMoreStatus]}</Text>
                </View>
            )
        }
    }

    _onEndReached(){

        if(this.props.autoLoadMore){
            if(!this.state.startAutoLoadMore){
                this.setState({
                    startAutoLoadMore: true
                },() => {  
                    this._onLoadMore()
                })
            }
        }
    }

    render(){
        return (
            <View {...this._panResponder.panHandlers} style={{flex:1}}>
                <Animated.View style={[styles.refresh,{height:this.state.refreshHeight}]}>
                    {this.state.refreshStatus == status.STATUS_REFRESHING && <ActivityIndicator/>}
                    <Text>{this.props.statusTextObj[this.state.refreshStatus]}</Text>
                </Animated.View>
                <Animated.View style={[styles.loadmore,{height:this.state.loadMoreHeight}]}>
                    {this.state.loadMoreStatus == loadMoreStatus.STATUS_LOADMOREING && <ActivityIndicator/>}
                    <Text>{this.props.loadMoreStatusTextObj[this.state.loadMoreStatus]}</Text>
                </Animated.View>
                <Animated.View style={{bottom:this.state.loadMoreHeight,flex:1}}>
                    <ListView ref={(e) => this.scrollview = e} 
                        {...this.props}
                        onLayout={this._onLayout.bind(this)}
                        showsVerticalScrollIndicator={false}
                        enableEmptySections={true}
                        onContentSizeChange={this._onContentSizeChange.bind(this)}
                        onScroll={this._onScroll.bind(this)}
                        onTouchEnd={() => this._onScrollEnd()}
                        onScrollEndDrag={() => this._onScrollEnd()}
                        onMomentumScrollEnd={() => this._onScrollEnd()}
                        onResponderRelease={() => this._onScrollEnd()}
                        renderFooter={() => this._renderFooter()}
                        onEndReached={() => this._onEndReached()}
                        onEndReachedThreshold={this.props.onEndReachedThreshold}
                        scrollEnabled={this.state.isEnableScroll}/>
                </Animated.View>
                
            </View>
        )
    }
}

const styles = StyleSheet.create({
    footer:{
        flex:1,
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        height: 50,
    },
    refresh: {
        position:'relative',
        width,
        zIndex:-10,
        top:0,
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
    },
    loadmore:{
        position:'absolute',
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        zIndex:-10,
        bottom:0,
        width,
    }
})