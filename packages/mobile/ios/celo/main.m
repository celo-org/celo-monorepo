#import <UIKit/UIKit.h>

#import "AppDelegate.h"

int main(int argc, char * argv[]) {
  @autoreleasepool {

    // Ignore SIGPIPE signals
    // SIGPIPE is sent when a process attempts to write to a socket that is no longer open for reading
    // Another cause of SIGPIPE is when you try to output to a socket that isn’t connected
    // We try to handle those cases by retrying (or reconnecting) usually
    signal(SIGPIPE, SIG_IGN);

    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}
