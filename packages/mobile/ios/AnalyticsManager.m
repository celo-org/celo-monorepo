#import "AnalyticsManager.h"

@implementation AnalyticsManager
  
- (NSArray<NSString *> *)supportedEvents {
    return @[@"onSessionConnect"];
}

- (void)sendEvent {
  [self sendEventWithName:@"SomeEvent" body:@{@"body": @"TEST"}];
}

@end

