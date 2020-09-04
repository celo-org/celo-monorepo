#import "AnalyticsManager.h"

@implementation AnalyticsManager

{
  bool hasListeners;
  NSNumber *timeStampObj;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
    if (self = [super init]) {
        NSTimeInterval timeStamp = [[NSDate date] timeIntervalSince1970];
        timeStampObj = [NSNumber numberWithDouble: timeStamp];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"AppStartedLoading"];
}

- (void)sendEvent {
  if (hasListeners) {
    [self sendEventWithName:@"AppStartedLoading" body:@{@"reactInitTime": timeStampObj}];
  }
}

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
  [self sendEvent];
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    hasListeners = NO;
}

@end
