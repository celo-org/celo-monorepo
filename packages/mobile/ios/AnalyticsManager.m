#import "AnalyticsManager.h"

@implementation AnalyticsManager

{
  bool hasListeners;
  NSNumber *timeStampObj;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init {
    if (self = [super init]) {
      timeStampObj = [NSNumber numberWithLongLong:([[NSDate date] timeIntervalSince1970] * 1000)];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"AppStartedLoading"];
}

- (void)sendEvent {
  if (hasListeners) {
    [self sendEventWithName:@"AppStartedLoading" body:@{@"appStartedMillis": timeStampObj}];
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
